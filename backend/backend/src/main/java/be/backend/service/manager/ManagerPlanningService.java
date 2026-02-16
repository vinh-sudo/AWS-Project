package be.backend.service.manager;

import be.backend.entity.*;
import be.backend.mapper.OrderMapper;
import be.backend.mapper.ProductionPlanMapper;
import be.backend.model.request.LinePlanRequest;
import be.backend.model.request.ProductionPlanRequest;
import be.backend.model.response.OrderResponse;
import be.backend.model.response.ProductionPlanResponse;
import be.backend.model.response.ScheduleValidationResult;
import be.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ManagerPlanningService {

    private final OrderRepository orderRepo;
    private final ProductionLineRepository lineRepo;
    private final ProductionPlanRepository planRepo;
    private final EmployeeRepository employeeRepo;
    private final ProductionPlanMapper mapper;
    private final OrderMapper orderMapper;
    private final AuditLogRepository auditRepo;
    private final ProductionFileRepository fileRepo;

    private final SchedulerService schedulerService;

    // ================= GET ORDERS FOR PLANNING =================
    public List<OrderResponse> getOrdersForPlanning(String status) {
        List<Order> orders;
        if (status != null && !status.isEmpty()) {
            orders = orderRepo.findByStatus(status);
        } else {
            orders = orderRepo.findAll();
        }
        return orders.stream().map(orderMapper::toResponse).toList();
    }

    @Transactional
    public List<ProductionPlanResponse> createPlan(
            ProductionPlanRequest request,
            Account account
    ) {

        planRepo.deleteByOrderIdAndDecision(request.getOrderId(), "DRAFT");

        Order order = orderRepo.findById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found"));

        Integer userId = account.getUser() != null ? account.getUser().getId() 
                : (account.getEmployee() != null && account.getEmployee().getUser() != null 
                    ? account.getEmployee().getUser().getId() : null);
        Employee manager = employeeRepo.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        List<ProductionPlan> plans = new ArrayList<>();

        for (LinePlanRequest lineReq : request.getLines()) {

            ProductionLine line = lineRepo.findById(lineReq.getLineId())
                    .orElseThrow(() -> new RuntimeException("Line not found"));

            int qty = lineReq.getPlannedQty();

            double hourlyCapacity = line.getCapacity() * line.getEfficiency().doubleValue();
            double hours = qty / hourlyCapacity;
            long days = (long) Math.ceil(hours / 8);

            ProductionPlan plan = new ProductionPlan();
            plan.setOrder(order);
            plan.setLine(line);
            plan.setPlanName(request.getPlanName());
            plan.setCreatedBy(manager);
            plan.setPlannedQuantity(qty);
            plan.setPlannedStartDate(request.getStartDate());
            plan.setPlannedEndDate(request.getStartDate().plusDays(days));
            plan.setEstimatedHours(hours);
            plan.setDecision("DRAFT");
            plan.setNote(request.getNote());
            plan.setCreatedAt(OffsetDateTime.now());

            plans.add(plan);
        }

        planRepo.saveAll(plans);

        order.setStatus("PLANNING");
        orderRepo.save(order);

        return mapper.toResponseList(plans);
    }

    // ================= CONFIRM =================
    @Transactional
    public ScheduleValidationResult confirm(Integer orderId, Account account) {

        List<ProductionPlan> plans =
                planRepo.findByOrderIdAndDecision(orderId, "DRAFT");

        if (plans.isEmpty()) {
            return ScheduleValidationResult.fail("No draft plan");
        }
        if (!fileRepo.existsByOrderId(orderId)) {
            return ScheduleValidationResult.fail(
                    "Order " + orderId + " has no SOP / BOM file"
            );
        }

        ScheduleValidationResult result =
                schedulerService.validateCapacity(plans);

        User user = account.getUser() != null ? account.getUser() 
                : (account.getEmployee() != null ? account.getEmployee().getUser() : null);

        if (!result.isOk()) {
            AuditLog log = new AuditLog();
            log.setUser(user);
            log.setActionType("CONFIRM_PLAN");
            log.setEntity("Order");
            log.setDetails("FAILED: " + result.getMessage());
            auditRepo.save(log);
            return result;
        }

        for (ProductionPlan plan : plans) {
            schedulerService.createSchedules(plan);
            plan.setDecision("CONFIRMED");
        }

        Order order = plans.get(0).getOrder();
        order.setStatus("SCHEDULED");
        orderRepo.save(order);

        AuditLog log = new AuditLog();
        log.setUser(user);
        log.setActionType("CONFIRM_PLAN");
        log.setEntity("Order");
        log.setDetails("Order " + orderId + " scheduled");
        auditRepo.save(log);

        return ScheduleValidationResult.success();
    }


    // ================= CANCEL =================
    @Transactional
    public void cancel(Integer orderId, Account account) {

        List<ProductionPlan> plans =
                planRepo.findByOrderIdAndDecision(orderId, "DRAFT");

        if (plans.isEmpty()) {
            throw new RuntimeException("No DRAFT plan to cancel");
        }

        plans.forEach(p -> p.setDecision("CANCELLED"));

        Order order = plans.get(0).getOrder();
        order.setStatus("NEW");
        orderRepo.save(order);

        User user = account.getUser() != null ? account.getUser() 
                : (account.getEmployee() != null ? account.getEmployee().getUser() : null);

        AuditLog log = new AuditLog();
        log.setUser(user);
        log.setActionType("CANCEL_PLAN");
        log.setEntity("Order");
        log.setDetails("Cancelled plan for order " + orderId);
        auditRepo.save(log);
    }

    public List<ProductionPlanResponse> getAllPlans(String status) {
        return mapper.toResponseList(planRepo.findAllForManager(status));
    }

}
