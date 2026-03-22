package be.backend.service.manager;

import be.backend.entity.*;
import be.backend.enums.ActionType;
import be.backend.mapper.ProductionPlanMapper;
import be.backend.model.request.CreatePlanByItemRequest;
import be.backend.model.response.OrderPlanItemsViewResponse;
import be.backend.model.response.ProductionPlanResponse;
import be.backend.model.response.ScheduleValidationResult;
import be.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ManagerPlanningService {

    private static final String DECISION_DRAFT = "DRAFT";
    private static final String DECISION_CONFIRMED = "CONFIRMED";

    private static final String ORDER_STATUS_NEW = "NEW";
    private static final String ORDER_STATUS_PLANNING = "PLANNING";
    private static final String ORDER_STATUS_PARTIALLY_SCHEDULED = "PARTIALLY_SCHEDULED";
    private static final String ORDER_STATUS_SCHEDULED = "SCHEDULED";

    private static final List<String> ROUTE_STAGE_KEYS = List.of("SMT", "DIP", "TEST", "PACK");

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
    public List<ProductionPlanResponse> createPlanByItem(
            CreatePlanByItemRequest request,
            Account account) {
        Order order = orderRepo.findById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found"));

        Employee manager = employeeRepo.findByUserId(account.getUser().getId())
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        OrderItem orderItem = orderItemRepo.findById(request.getOrderItemId())
                .orElseThrow(() -> new RuntimeException("Order item not found"));

        if (!Objects.equals(orderItem.getOrder().getId(), order.getId())) {
            throw new RuntimeException("Order item " + request.getOrderItemId()
                    + " does not belong to order " + order.getId());
        }

        int requiredQty = orderItem.getQuantity();
        Map<Integer, Integer> confirmedQtyByItem = sumPlannedQtyByItem(
                planRepo.findByOrderIdAndDecision(order.getId(), DECISION_CONFIRMED));
        int alreadyConfirmedQty = confirmedQtyByItem.getOrDefault(orderItem.getId(), 0);
        int existingDraftQty = extractItemQtyFromPlans(
                planRepo.findByOrderIdAndOrderItemIdAndDecision(order.getId(), orderItem.getId(), DECISION_DRAFT));

        int remainingQty = requiredQty - alreadyConfirmedQty - existingDraftQty;
        if (request.getPlannedQty() > remainingQty) {
            throw new RuntimeException("Planned qty (" + request.getPlannedQty() + ") exceeds remaining qty ("
                    + remainingQty + ") for order item " + orderItem.getId());
        }

        List<ProductionLine> allLines = lineRepo.findAll();

        ProductionLine smtLine = findRouteLine(allLines, "SMT");
        ProductionLine dipLine = findRouteLine(allLines, "DIP");
        ProductionLine testLine = findRouteLine(allLines, "TEST");
        ProductionLine packingLine = findRouteLine(allLines, "PACK");

        LocalDate stageStart = request.getStartDate();
        List<ProductionPlan> plans = new ArrayList<>();

        for (ProductionLine line : List.of(smtLine, dipLine, testLine, packingLine)) {
            ProductionPlan plan = buildDraftPlan(
                    order,
                    orderItem,
                    line,
                    manager,
                    request.getPlanName(),
                    request.getPlannedQty(),
                    stageStart,
                    request.getNote());
            plans.add(plan);
            stageStart = plan.getPlannedEndDate();
        }

        planRepo.saveAll(plans);

        if (!planRepo.existsByOrderIdAndDecision(order.getId(), DECISION_CONFIRMED)) {
            order.setStatus(ORDER_STATUS_PLANNING);
            orderRepo.save(order);
        }

        return mapper.toResponseList(plans);
    }

    // ================= CONFIRM (single order item) =================
    @Transactional
    public ScheduleValidationResult confirmOrderItem(Integer orderId, Integer orderItemId, Account account) {

        Order order = orderRepo.findByIdForUpdate(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!fileRepo.existsByOrderId(orderId)) {
            return ScheduleValidationResult.fail("Order " + orderId + " has no SOP / BOM file");
        }

        OrderItem orderItem = orderItemRepo.findById(orderItemId)
                .orElseThrow(() -> new RuntimeException("Order item not found"));

        if (!Objects.equals(orderItem.getOrder().getId(), orderId)) {
            return ScheduleValidationResult.fail("Order item does not belong to order " + orderId);
        }

        List<ProductionPlan> itemDraftPlans = planRepo.findByOrderIdAndOrderItemIdAndDecisionForUpdate(
                orderId,
                orderItemId,
                DECISION_DRAFT);

        if (itemDraftPlans.isEmpty()) {
            return ScheduleValidationResult.fail("No draft plan for order item " + orderItemId);
        }

        List<ProductionPlan> itemConfirmedPlans = planRepo.findByOrderIdAndOrderItemIdAndDecision(
                orderId,
                orderItemId,
                DECISION_CONFIRMED);

        int alreadyConfirmedQty = extractItemQtyFromPlans(itemConfirmedPlans);
        int draftQty = extractItemQtyFromPlans(itemDraftPlans);
        int requiredQty = orderItem.getQuantity();

        if (alreadyConfirmedQty >= requiredQty) {
            return ScheduleValidationResult.fail("Order item " + orderItemId + " already fully confirmed");
        }

        int remainingQty = requiredQty - alreadyConfirmedQty;
        if (draftQty > remainingQty) {
            return ScheduleValidationResult.fail(
                    "Draft qty (" + draftQty + ") exceeds remaining required qty (" + remainingQty + ")");
        }

        ScheduleValidationResult capacity = schedulerService.validateCapacity(itemDraftPlans);
        if (!capacity.isOk()) {
            return capacity;
        }

        for (ProductionPlan plan : itemDraftPlans) {
            SchedulerService.ScheduleCreationResult creation = schedulerService.createSchedules(plan);
            if (!creation.ok()) {
                return ScheduleValidationResult.fail(creation.message());
            }
            plan.setDecision(DECISION_CONFIRMED);
        }

        List<OrderItem> orderItems = orderItemRepo.findByOrderId(orderId);
        Map<Integer, Integer> confirmedQtyByItem = sumPlannedQtyByItem(
                planRepo.findByOrderIdAndDecision(orderId, DECISION_CONFIRMED));

        String nextOrderStatus = computeNextOrderStatus(orderItems, confirmedQtyByItem);
        order.setStatus(nextOrderStatus);
        orderRepo.save(order);

        ScheduleValidationResult result = ScheduleValidationResult.success(
                "Order item " + orderItemId + " confirmed");
        result.setOrderStatus(nextOrderStatus);
        result.setConfirmedOrderItemIds(List.of(orderItemId));
        result.setFailedOrderItems(Map.of());

        AuditLog log = new AuditLog();
        log.setUser(account.getUser());
        log.setActionType(ActionType.CONFIRM_PLAN);
        log.setEntity("OrderItem");
        log.setDetails("Order " + orderId + " - order item " + orderItemId + " confirmed");
        auditRepo.save(log);

        return result;
    }

    @Transactional(readOnly = true)
    public OrderPlanItemsViewResponse getOrderItemPlansView(Integer orderId) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        boolean hasFiles = fileRepo.existsByOrderId(orderId);
        List<OrderItem> orderItems = orderItemRepo.findByOrderId(orderId);
        List<ProductionPlan> plans = planRepo.findByOrderIdForManager(orderId);

        Map<Integer, List<ProductionPlan>> plansByItem = new LinkedHashMap<>();
        for (ProductionPlan plan : plans) {
            if (plan.getOrderItem() == null) {
                continue;
            }
            plansByItem.computeIfAbsent(plan.getOrderItem().getId(), ignored -> new ArrayList<>()).add(plan);
        }

        List<OrderPlanItemsViewResponse.ItemView> itemViews = new ArrayList<>();
        for (OrderItem item : orderItems) {
            List<ProductionPlan> itemPlans = plansByItem.getOrDefault(item.getId(), List.of());

            List<ProductionPlan> itemDraftPlans = filterPlansByDecision(itemPlans, DECISION_DRAFT);
            int draftQty = extractItemQtyFromPlans(itemDraftPlans);
            int confirmedQty = extractItemQtyFromPlans(filterPlansByDecision(itemPlans, DECISION_CONFIRMED));
            int remainingQty = Math.max(item.getQuantity() - confirmedQty, 0);

            boolean canConfirm = hasFiles && draftQty > 0 && confirmedQty < item.getQuantity()
                    && draftQty <= remainingQty;
            String confirmBlockedReason;

            if (canConfirm) {
                ScheduleValidationResult capacityCheck = schedulerService.validateCapacity(itemDraftPlans);
                if (capacityCheck.isOk()) {
                    confirmBlockedReason = null;
                } else {
                    canConfirm = false;
                    confirmBlockedReason = capacityCheck.getMessage();
                }
            } else {
                confirmBlockedReason = deriveConfirmBlockedReason(
                        hasFiles,
                        draftQty,
                        confirmedQty,
                        item.getQuantity(),
                        remainingQty);
            }

            List<OrderPlanItemsViewResponse.StageView> stages = itemPlans.stream()
                    .sorted(Comparator
                            .comparingInt((ProductionPlan p) -> routeRank(p.getLine().getLineName()))
                            .thenComparing(ProductionPlan::getCreatedAt,
                                    Comparator.nullsLast(Comparator.naturalOrder()))
                            .thenComparing(ProductionPlan::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                    .map(plan -> OrderPlanItemsViewResponse.StageView.builder()
                            .planId(plan.getId())
                            .stage(stageFromLineName(plan.getLine().getLineName()))
                            .lineId(plan.getLine().getId())
                            .lineName(plan.getLine().getLineName())
                            .plannedQuantity(plan.getPlannedQuantity())
                            .decision(plan.getDecision())
                            .startDate(plan.getPlannedStartDate())
                            .endDate(plan.getPlannedEndDate())
                            .estimatedHours(plan.getEstimatedHours())
                            .build())
                    .collect(Collectors.toList());

            itemViews.add(OrderPlanItemsViewResponse.ItemView.builder()
                    .orderItemId(item.getId())
                    .requiredQuantity(item.getQuantity())
                    .draftQuantity(draftQty)
                    .confirmedQuantity(confirmedQty)
                    .remainingQuantity(remainingQty)
                    .itemStatus(computeItemStatus(item.getQuantity(), draftQty, confirmedQty))
                    .canConfirm(canConfirm)
                    .confirmBlockedReason(confirmBlockedReason)
                    .stages(stages)
                    .build());
        }

        itemViews.sort(Comparator.comparing(OrderPlanItemsViewResponse.ItemView::getOrderItemId));

        return OrderPlanItemsViewResponse.builder()
                .orderId(order.getId())
                .orderStatus(order.getStatus())
                .hasProductionFiles(hasFiles)
                .items(itemViews)
                .build();
    }

    private ProductionPlan buildDraftPlan(
            Order order,
            OrderItem orderItem,
            ProductionLine line,
            Employee manager,
            String planName,
            Integer qty,
            LocalDate startDate,
            String note) {
        double hourlyCapacity = line.getCapacity() * line.getEfficiency().doubleValue();
        double hours = qty / hourlyCapacity;
        long days = (long) Math.ceil(hours / 8);

        ProductionPlan plan = new ProductionPlan();
        plan.setOrder(order);
        plan.setOrderItem(orderItem);
        plan.setLine(line);
        plan.setPlanName(planName);
        plan.setCreatedBy(manager);
        plan.setPlannedQuantity(qty);
        plan.setPlannedStartDate(startDate);
        plan.setPlannedEndDate(startDate.plusDays(days));
        plan.setEstimatedHours(hours);
        plan.setDecision(DECISION_DRAFT);
        plan.setNote(note);
        plan.setCreatedAt(OffsetDateTime.now());
        return plan;
    }

    private ProductionLine findRouteLine(List<ProductionLine> lines, String stageKey) {
        String normalizedKey = stageKey.toUpperCase(Locale.ROOT);
        return lines.stream()
                .filter(line -> line.getLineName() != null)
                .filter(line -> line.getLineName().toUpperCase(Locale.ROOT).contains(normalizedKey))
                .min(Comparator.comparing(ProductionLine::getId))
                .orElseThrow(() -> new RuntimeException("No production line found for stage " + stageKey));
    }

    private Map<Integer, Integer> sumPlannedQtyByItem(List<ProductionPlan> plans) {
        Map<Integer, List<ProductionPlan>> plansByItem = new LinkedHashMap<>();
        for (ProductionPlan plan : plans) {
            if (plan.getOrderItem() == null) {
                continue;
            }
            plansByItem.computeIfAbsent(plan.getOrderItem().getId(), ignored -> new ArrayList<>()).add(plan);
        }

        Map<Integer, Integer> qtyByItem = new HashMap<>();
        for (Map.Entry<Integer, List<ProductionPlan>> entry : plansByItem.entrySet()) {
            qtyByItem.put(entry.getKey(), extractItemQtyFromPlans(entry.getValue()));
        }
        return qtyByItem;
    }

    private int extractItemQtyFromPlans(List<ProductionPlan> plans) {
        if (plans.isEmpty()) {
            return 0;
        }

        int anchorRank = plans.stream()
                .mapToInt(plan -> routeRank(plan.getLine().getLineName()))
                .min()
                .orElse(99);

        return plans.stream()
                .filter(plan -> routeRank(plan.getLine().getLineName()) == anchorRank)
                .mapToInt(ProductionPlan::getPlannedQuantity)
                .sum();
    }

    private int routeRank(String lineName) {
        if (lineName == null) {
            return 99;
        }

        String normalized = lineName.toUpperCase(Locale.ROOT);
        for (int i = 0; i < ROUTE_STAGE_KEYS.size(); i++) {
            if (normalized.contains(ROUTE_STAGE_KEYS.get(i))) {
                return i;
            }
        }
        return 99;
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

    private String computeNextOrderStatus(List<OrderItem> orderItems, Map<Integer, Integer> confirmedQtyByItem) {
        if (isOrderFullyConfirmed(orderItems, confirmedQtyByItem)) {
            return ORDER_STATUS_SCHEDULED;
        }

        boolean hasAnyConfirmed = confirmedQtyByItem.values().stream().anyMatch(qty -> qty != null && qty > 0);
        return hasAnyConfirmed ? ORDER_STATUS_PARTIALLY_SCHEDULED : ORDER_STATUS_PLANNING;
    }

    // ================= CANCEL =================
    @Transactional
    public ScheduleValidationResult cancelOrderItem(Integer orderId, Integer orderItemId, Account account) {

        Order order = orderRepo.findByIdForUpdate(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        OrderItem orderItem = orderItemRepo.findById(orderItemId)
                .orElseThrow(() -> new RuntimeException("Order item not found"));

        if (!Objects.equals(orderItem.getOrder().getId(), orderId)) {
            return ScheduleValidationResult.fail("Order item does not belong to order " + orderId);
        }

        List<ProductionPlan> itemDraftPlans = planRepo.findByOrderIdAndOrderItemIdAndDecisionForUpdate(
                orderId,
                orderItemId,
                DECISION_DRAFT);

        if (itemDraftPlans.isEmpty()) {
            return ScheduleValidationResult.fail("No DRAFT plan to cancel for order item " + orderItemId);
        }

        // mark drafts as cancelled for this item
        itemDraftPlans.forEach(p -> p.setDecision("CANCELLED"));

        // recompute order status after change
        List<OrderItem> orderItems = orderItemRepo.findByOrderId(orderId);
        Map<Integer, Integer> confirmedQtyByItem = sumPlannedQtyByItem(
                planRepo.findByOrderIdAndDecision(orderId, DECISION_CONFIRMED));

        String nextOrderStatus = computeNextOrderStatus(orderItems, confirmedQtyByItem);
        order.setStatus(nextOrderStatus);
        orderRepo.save(order);

        AuditLog log = new AuditLog();
        log.setUser(account.getUser());
        log.setActionType(ActionType.CANCEL_PLAN);
        log.setEntity("OrderItem");
        log.setDetails("Cancelled plan for order " + orderId + " - order item " + orderItemId);
        auditRepo.save(log);

        ScheduleValidationResult result = ScheduleValidationResult.success(
                "Order item " + orderItemId + " plan cancelled");
        result.setOrderStatus(nextOrderStatus);
        result.setConfirmedOrderItemIds(List.of());
        result.setFailedOrderItems(Map.of());
        return result;
    }

    @Transactional
    public void cancel(Integer orderId, Account account) {
        // cancel DRAFT plans for all order items of this order
        List<OrderItem> orderItems = orderItemRepo.findByOrderId(orderId);
        if (orderItems.isEmpty()) {
            throw new RuntimeException("Order has no items to cancel plan for");
        }

        List<ProductionPlan> plans = planRepo.findByOrderIdAndDecision(orderId, DECISION_DRAFT);
        if (plans.isEmpty()) {
            throw new RuntimeException("No DRAFT plan to cancel");
        }

        plans.forEach(p -> p.setDecision("CANCELLED"));

        Order order = plans.get(0).getOrder();
        Map<Integer, Integer> confirmedQtyByItem = sumPlannedQtyByItem(
                planRepo.findByOrderIdAndDecision(orderId, DECISION_CONFIRMED));
        String nextOrderStatus = computeNextOrderStatus(orderItems, confirmedQtyByItem);
        order.setStatus(nextOrderStatus);
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

    private List<ProductionPlan> filterPlansByDecision(List<ProductionPlan> plans, String decision) {
        return plans.stream()
                .filter(plan -> decision.equals(plan.getDecision()))
                .collect(Collectors.toList());
    }

    private String computeItemStatus(int requiredQty, int draftQty, int confirmedQty) {
        if (confirmedQty >= requiredQty) {
            return ORDER_STATUS_SCHEDULED;
        }
        if (confirmedQty > 0) {
            return ORDER_STATUS_PARTIALLY_SCHEDULED;
        }
        if (draftQty > 0) {
            return ORDER_STATUS_PLANNING;
        }
        return ORDER_STATUS_NEW;
    }

    private String deriveConfirmBlockedReason(boolean hasFiles,
            int draftQty,
            int confirmedQty,
            int requiredQty,
            int remainingQty) {
        if (!hasFiles) {
            return "Order has no SOP / BOM file";
        }
        if (confirmedQty >= requiredQty) {
            return "Order item already fully confirmed";
        }
        if (draftQty <= 0) {
            return "No draft plan for this order item";
        }
        if (draftQty > remainingQty) {
            return "Draft qty exceeds remaining required qty";
        }
        return "Item cannot be confirmed";
    }

    private String stageFromLineName(String lineName) {
        if (lineName == null) {
            return "OTHER";
        }

        String normalized = lineName.toUpperCase(Locale.ROOT);
        // Match actual line names: "SMT Line", "DIP Line", "Assembly Line", "Testing Line", "Packing Line"
        if (normalized.contains("SMT")) {
            return "SMT";
        }
        if (normalized.contains("DIP")) {
            return "DIP";
        }
        if (normalized.contains("ASSEMBLY")) {
            return "ASSEMBLY";
        }
        if (normalized.contains("TEST")) {
            return "TEST";
        }
        if (normalized.contains("PACK")) {
            return "PACK";
        }
        return "OTHER";
    }
}
