package be.backend.service.manager;

import be.backend.entity.*;
import be.backend.enums.ActionType;
import be.backend.mapper.ProductionPlanMapper;
import be.backend.model.request.LinePlanRequest;
import be.backend.model.request.ProductionPlanRequest;
import be.backend.model.response.ProductionPlanResponse;
import be.backend.model.response.ScheduleValidationResult;
import be.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ManagerPlanningService {

    private final OrderRepository orderRepo;
    private final ProductionLineRepository lineRepo;
    private final ProductionPlanRepository planRepo;
    private final EmployeeRepository employeeRepo;
    private final ProductionPlanMapper mapper;
    private final AuditLogRepository auditRepo;
    private final ProductionFileRepository fileRepo;
    private final OrderItemRepository orderItemRepo;

    private final SchedulerService schedulerService;

    @Transactional
    public List<ProductionPlanResponse> createPlan(
            ProductionPlanRequest request,
            Account account
    ) {

        // Keep existing DRAFT plans so managers can add plans in multiple sessions.
        // planRepo.deleteByOrderIdAndDecision(request.getOrderId(), "DRAFT");

        Order order = orderRepo.findById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found"));

        Employee manager = employeeRepo.findByUserId(account.getUser().getId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        Map<Integer, OrderItem> orderItemsById = new HashMap<>();
        for (OrderItem item : orderItemRepo.findByOrderId(order.getId())) {
            orderItemsById.put(item.getId(), item);
        }

        List<ProductionPlan> plans = new ArrayList<>();

        for (LinePlanRequest lineReq : request.getLines()) {

            ProductionLine line = lineRepo.findById(lineReq.getLineId())
                    .orElseThrow(() -> new RuntimeException("Line not found"));

            if (lineReq.getOrderItemId() == null) {
                throw new RuntimeException("orderItemId is required for each line plan");
            }

            OrderItem orderItem = orderItemsById.get(lineReq.getOrderItemId());
            if (orderItem == null) {
                throw new RuntimeException("Order item " + lineReq.getOrderItemId()
                        + " does not belong to order " + order.getId());
            }

            int qty = lineReq.getPlannedQty();

            double hourlyCapacity = line.getCapacity() * line.getEfficiency().doubleValue();
            double hours = qty / hourlyCapacity;
            long days = (long) Math.ceil(hours / 8);

            ProductionPlan plan = new ProductionPlan();
            plan.setOrder(order);
            plan.setOrderItem(orderItem);
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

        // Only move to PLANNING when this order has not been scheduled yet.
        if (!planRepo.existsByOrderIdAndDecision(order.getId(), "CONFIRMED")) {
            order.setStatus("PLANNING");
            orderRepo.save(order);
        }

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

        Order order = plans.get(0).getOrder();
        List<OrderItem> orderItems = orderItemRepo.findByOrderId(orderId);

        if (!orderItems.isEmpty()) {
            Map<Integer, Integer> plannedPerItem = new HashMap<>();
            for (ProductionPlan plan : plans) {
                if (plan.getOrderItem() == null) {
                    return ScheduleValidationResult.fail(
                            "Plan " + plan.getId() + " is missing order item"
                    );
                }
                plannedPerItem.merge(
                        plan.getOrderItem().getId(),
                        plan.getPlannedQuantity(),
                        Integer::sum
                );
            }

            for (OrderItem item : orderItems) {
                int plannedQty = plannedPerItem.getOrDefault(item.getId(), 0);
                if (plannedQty < item.getQuantity()) {
                    return ScheduleValidationResult.fail(
                            "Planned quantity for item " + item.getId()
                                    + " (" + plannedQty + ") is less than required quantity ("
                                    + item.getQuantity() + ")"
                    );
                }
            }
        }

        ScheduleValidationResult result =
                schedulerService.validateCapacity(plans);

        if (!result.isOk()) {
            AuditLog log = new AuditLog();
            log.setUser(account.getUser());
            log.setActionType(ActionType.CONFIRM_PLAN);
            log.setEntity("Order");
            log.setDetails("FAILED: " + result.getMessage());
            auditRepo.save(log);
            return result;
        }

        for (ProductionPlan plan : plans) {
            schedulerService.createSchedules(plan);
            plan.setDecision("CONFIRMED");
        }

        order.setStatus("SCHEDULED");
        orderRepo.save(order);

        AuditLog log = new AuditLog();
        log.setUser(account.getUser());
        log.setActionType(ActionType.CONFIRM_PLAN);
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
        if (planRepo.existsByOrderIdAndDecision(orderId, "CONFIRMED")) {
            order.setStatus("SCHEDULED");
        } else {
            order.setStatus("NEW");
        }
        orderRepo.save(order);

        AuditLog log = new AuditLog();
        log.setUser(account.getUser());
        log.setActionType(ActionType.CANCEL_PLAN);
        log.setEntity("Order");
        log.setDetails("Cancelled plan for order " + orderId);
        auditRepo.save(log);
    }

    public List<ProductionPlanResponse> getAllPlans(String status) {
        return mapper.toResponseList(planRepo.findAllForManager(status));
    }

}
