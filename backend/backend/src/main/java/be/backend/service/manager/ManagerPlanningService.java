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
import java.util.LinkedHashMap;
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

        // Lock order row so only one confirm flow can process this order at a time.
        Order order = orderRepo.findByIdForUpdate(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        List<ProductionPlan> draftPlans =
                planRepo.findByOrderIdAndDecisionForUpdate(orderId, "DRAFT");

        if (draftPlans.isEmpty()) {
            return ScheduleValidationResult.fail("No draft plan");
        }
        if (!fileRepo.existsByOrderId(orderId)) {
            return ScheduleValidationResult.fail(
                    "Order " + orderId + " has no SOP / BOM file"
            );
        }

        List<OrderItem> orderItems = orderItemRepo.findByOrderId(orderId);
        Map<Integer, OrderItem> orderItemsById = new HashMap<>();
        for (OrderItem item : orderItems) {
            orderItemsById.put(item.getId(), item);
        }

        // Include already confirmed plans so full/partial status is calculated across multiple confirm batches.
        List<ProductionPlan> confirmedPlans = planRepo.findByOrderIdAndDecision(orderId, "CONFIRMED");
        Map<Integer, Integer> confirmedQtyByItem = sumPlannedQtyByItem(confirmedPlans);

        Map<Integer, List<ProductionPlan>> draftPlansByItem = new LinkedHashMap<>();
        for (ProductionPlan plan : draftPlans) {
            if (plan.getOrderItem() == null) {
                return ScheduleValidationResult.fail("Plan " + plan.getId() + " is missing order item");
            }
            draftPlansByItem.computeIfAbsent(plan.getOrderItem().getId(), key -> new ArrayList<>()).add(plan);
        }

        List<Integer> confirmedItems = new ArrayList<>();
        Map<Integer, String> failedItems = new LinkedHashMap<>();
        List<ProductionPlan> reservedCapacityPlans = new ArrayList<>();

        for (Map.Entry<Integer, List<ProductionPlan>> entry : draftPlansByItem.entrySet()) {
            Integer orderItemId = entry.getKey();
            List<ProductionPlan> itemPlans = entry.getValue();

            OrderItem orderItem = orderItemsById.get(orderItemId);
            if (orderItem == null) {
                failedItems.put(orderItemId, "Order item does not belong to order " + orderId);
                continue;
            }

            int requiredQty = orderItem.getQuantity();
            int alreadyConfirmedQty = confirmedQtyByItem.getOrDefault(orderItemId, 0);
            int draftQty = itemPlans.stream().mapToInt(ProductionPlan::getPlannedQuantity).sum();

            if (alreadyConfirmedQty >= requiredQty) {
                failedItems.put(orderItemId, "Item already fully confirmed");
                continue;
            }

            int remainingQty = requiredQty - alreadyConfirmedQty;
            if (draftQty > remainingQty) {
                failedItems.put(
                        orderItemId,
                        "Draft qty (" + draftQty + ") exceeds remaining required qty (" + remainingQty + ")"
                );
                continue;
            }

            // Validate this item against already-reserved capacity from previously approved items.
            List<ProductionPlan> capacityCheckPlans = new ArrayList<>(reservedCapacityPlans);
            capacityCheckPlans.addAll(itemPlans);
            ScheduleValidationResult capacity = schedulerService.validateCapacity(capacityCheckPlans);
            if (!capacity.isOk()) {
                failedItems.put(orderItemId, capacity.getMessage());
                continue;
            }

            boolean itemCreated = true;
            String itemFailureReason = null;

            for (ProductionPlan plan : itemPlans) {
                SchedulerService.ScheduleCreationResult creation = schedulerService.createSchedules(plan);
                if (!creation.ok()) {
                    itemCreated = false;
                    itemFailureReason = creation.message();
                    break;
                }
                plan.setDecision("CONFIRMED");
            }

            if (!itemCreated) {
                failedItems.put(orderItemId, itemFailureReason);
                continue;
            }

            reservedCapacityPlans.addAll(itemPlans);
            confirmedItems.add(orderItemId);
            confirmedQtyByItem.merge(orderItemId, draftQty, Integer::sum);
        }

        String nextOrderStatus = isOrderFullyConfirmed(orderItems, confirmedQtyByItem)
                ? "SCHEDULED"
                : "PLANNING";
        order.setStatus(nextOrderStatus);
        orderRepo.save(order);

        ScheduleValidationResult response;
        if (confirmedItems.isEmpty()) {
            response = ScheduleValidationResult.fail("No order item was confirmed");
        } else {
            String message = failedItems.isEmpty()
                    ? "All draft items confirmed"
                    : "Partial confirm: " + confirmedItems.size() + " item(s) confirmed";
            response = ScheduleValidationResult.success(message);
        }

        response.setOrderStatus(nextOrderStatus);
        response.setConfirmedOrderItemIds(confirmedItems);
        response.setFailedOrderItems(failedItems);

        AuditLog log = new AuditLog();
        log.setUser(account.getUser());
        log.setActionType(ActionType.CONFIRM_PLAN);
        log.setEntity("Order");
        log.setDetails("Order " + orderId + ": " + response.getMessage());
        auditRepo.save(log);

        return response;
    }

    private Map<Integer, Integer> sumPlannedQtyByItem(List<ProductionPlan> plans) {
        Map<Integer, Integer> qtyByItem = new HashMap<>();
        for (ProductionPlan plan : plans) {
            if (plan.getOrderItem() == null) {
                continue;
            }
            qtyByItem.merge(plan.getOrderItem().getId(), plan.getPlannedQuantity(), Integer::sum);
        }
        return qtyByItem;
    }

    private boolean isOrderFullyConfirmed(List<OrderItem> orderItems, Map<Integer, Integer> confirmedQtyByItem) {
        for (OrderItem item : orderItems) {
            int confirmedQty = confirmedQtyByItem.getOrDefault(item.getId(), 0);
            if (confirmedQty < item.getQuantity()) {
                return false;
            }
        }
        return true;
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
