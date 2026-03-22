package be.backend.service.manager;

import be.backend.entity.Order;
import be.backend.entity.OrderItem;
import be.backend.entity.ProductionSchedule;
import be.backend.entity.Report;
import be.backend.exception.ResourceNotFoundException;
import be.backend.model.response.ManagerOrderProgressResponse;
import be.backend.repository.OrderItemRepository;
import be.backend.repository.OrderRepository;
import be.backend.repository.ProductionScheduleRepository;
import be.backend.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ManagerTrackingService {

    private final OrderRepository orderRepo;
    private final OrderItemRepository orderItemRepo;
    private final ProductionScheduleRepository scheduleRepo;
    private final ReportRepository reportRepo;

    public ManagerOrderProgressResponse getOrderProgress(Integer orderId) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId.toString()));

        List<OrderItem> items = orderItemRepo.findByOrderId(orderId);
        List<ProductionSchedule> schedules = scheduleRepo.findByOrderId(orderId);
        List<Report> reports = reportRepo.findAll(); // will be filtered per schedule below

        BigDecimal orderCompletion = calculateOrderCompletionPercentage(order, items);
        boolean routeCompleted = isOrderRouteCompleted(order, items, schedules);

        List<ManagerOrderProgressResponse.ItemProgressView> itemViews = items.stream()
                .map(item -> buildItemProgressView(item, schedules, reports))
                .collect(Collectors.toList());

        return ManagerOrderProgressResponse.builder()
                .orderId(order.getId())
                .orderStatus(order.getStatus())
                .orderCompletionPercentage(orderCompletion)
                .routeCompleted(routeCompleted)
                .items(itemViews)
                .build();
    }

    private ManagerOrderProgressResponse.ItemProgressView buildItemProgressView(
            OrderItem item,
            List<ProductionSchedule> allSchedules,
            List<Report> allReports) {

        BigDecimal itemCompletion = calculateOrderItemCompletionPercentage(item);

        List<ProductionSchedule> itemSchedules = allSchedules.stream()
                .filter(s -> s.getPlan() != null
                        && s.getPlan().getOrderItem() != null
                        && item.getId().equals(s.getPlan().getOrderItem().getId()))
                .collect(Collectors.toList());

        boolean routeCompleted = isOrderItemRouteCompleted(item, itemSchedules);

        Map<String, List<ProductionSchedule>> schedulesByStage = itemSchedules.stream()
                .collect(Collectors.groupingBy(s -> stageKeyFromLineName(s.getPlan().getLine().getLineName())));

        List<ManagerOrderProgressResponse.StageProgressView> stageViews = schedulesByStage.entrySet().stream()
                .map(entry -> buildStageProgressView(entry.getKey(), entry.getValue(), allReports))
                .sorted(Comparator.comparingInt(e -> stageRank(e.getStage())))
                .collect(Collectors.toList());

        return ManagerOrderProgressResponse.ItemProgressView.builder()
                .orderItemId(item.getId())
                .productName(item.getProductName())
                .requiredQuantity(item.getQuantity())
                .completionPercentage(itemCompletion)
                .routeCompleted(routeCompleted)
                .stages(stageViews)
                .build();
    }

    private ManagerOrderProgressResponse.StageProgressView buildStageProgressView(
            String stageKey,
            List<ProductionSchedule> stageSchedules,
            List<Report> allReports) {

        // For now assume one schedule per stage; if multiple, aggregate them
        ProductionSchedule mainSchedule = stageSchedules.stream()
                .min(Comparator.comparing(ProductionSchedule::getId))
                .orElse(null);

        if (mainSchedule == null) {
            return ManagerOrderProgressResponse.StageProgressView.builder()
                    .stage(stageKey)
                    .build();
        }

        Integer scheduleId = mainSchedule.getId();

        List<Report> scheduleReports = allReports.stream()
                .filter(r -> r.getSchedule() != null && scheduleId.equals(r.getSchedule().getId()))
                .collect(Collectors.toList());

        int totalGood = scheduleReports.stream()
                .mapToInt(r -> Optional.ofNullable(r.getGoodQuantity()).orElse(0))
                .sum();
        int totalReject = scheduleReports.stream()
                .mapToInt(r -> Optional.ofNullable(r.getRejectQuantity()).orElse(0))
                .sum();
        int effectiveTarget = scheduleReports.stream()
                .mapToInt(r -> Optional.ofNullable(r.getTargetQuantity()).orElse(0))
                .sum();

        BigDecimal stagePercentage = BigDecimal.ZERO;
        if (effectiveTarget > 0) {
            stagePercentage = BigDecimal.valueOf(totalGood)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(effectiveTarget), 2, RoundingMode.HALF_UP)
                    .min(BigDecimal.valueOf(100));
        }

        List<ManagerOrderProgressResponse.DailyReportView> dailyViews = scheduleReports.stream()
                .collect(Collectors.groupingBy(Report::getWorkDate))
                .entrySet().stream()
                .map(entry -> buildDailyReportView(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(ManagerOrderProgressResponse.DailyReportView::getWorkDate))
                .collect(Collectors.toList());

        return ManagerOrderProgressResponse.StageProgressView.builder()
                .stage(stageKey)
                .lineId(mainSchedule.getPlan().getLine().getId())
                .lineName(mainSchedule.getPlan().getLine().getLineName())
                .scheduleStatus(mainSchedule.getStatus())
                .stageCompletionPercentage(stagePercentage)
                .effectiveTargetQuantity(effectiveTarget)
                .totalGoodQuantity(totalGood)
                .totalRejectQuantity(totalReject)
                .dailyReports(dailyViews)
                .build();
    }

    private ManagerOrderProgressResponse.DailyReportView buildDailyReportView(
            LocalDate date,
            List<Report> reports) {
        int target = reports.stream()
                .mapToInt(r -> Optional.ofNullable(r.getTargetQuantity()).orElse(0))
                .sum();
        int good = reports.stream()
                .mapToInt(r -> Optional.ofNullable(r.getGoodQuantity()).orElse(0))
                .sum();
        int reject = reports.stream()
                .mapToInt(r -> Optional.ofNullable(r.getRejectQuantity()).orElse(0))
                .sum();
        int downtime = reports.stream()
                .mapToInt(r -> Optional.ofNullable(r.getDowntimeMinutes()).orElse(0))
                .sum();

        // If multiple shifts per day, we can concatenate or leave null; for now, just take first shift
        String shift = reports.stream()
                .map(Report::getShift)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);

        return ManagerOrderProgressResponse.DailyReportView.builder()
                .workDate(date)
                .shift(shift)
                .targetQuantity(target)
                .goodQuantity(good)
                .rejectQuantity(reject)
                .downtimeMinutes(downtime)
                .build();
    }

    private BigDecimal calculateOrderCompletionPercentage(Order order, List<OrderItem> items) {
        int orderQty = items.stream()
                .mapToInt(OrderItem::getQuantity)
                .sum();
        if (orderQty <= 0) {
            return BigDecimal.ZERO;
        }
        Long producedQtyRaw = reportRepo.sumGoodQuantityByOrderId(order.getId());
        long producedQty = producedQtyRaw == null ? 0L : producedQtyRaw;

        BigDecimal percentage = BigDecimal.valueOf(producedQty)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(orderQty), 2, RoundingMode.HALF_UP);

        return percentage.min(BigDecimal.valueOf(100));
    }

    private BigDecimal calculateOrderItemCompletionPercentage(OrderItem orderItem) {
        if (orderItem.getQuantity() == null || orderItem.getQuantity() <= 0) {
            return BigDecimal.ZERO;
        }
        Long producedQtyRaw = reportRepo.sumGoodQuantityByOrderItemId(orderItem.getId());
        long producedQty = producedQtyRaw == null ? 0L : producedQtyRaw;

        BigDecimal percentage = BigDecimal.valueOf(producedQty)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(orderItem.getQuantity()), 2, RoundingMode.HALF_UP);

        return percentage.min(BigDecimal.valueOf(100));
    }

    private boolean isOrderRouteCompleted(Order order, List<OrderItem> items, List<ProductionSchedule> schedules) {
        if (items.isEmpty()) {
            return false;
        }
        for (OrderItem item : items) {
            List<ProductionSchedule> itemSchedules = schedules.stream()
                    .filter(s -> s.getPlan() != null
                            && s.getPlan().getOrderItem() != null
                            && item.getId().equals(s.getPlan().getOrderItem().getId()))
                    .collect(Collectors.toList());
            if (!isOrderItemRouteCompleted(item, itemSchedules)) {
                return false;
            }
        }
        return true;
    }

    private boolean isOrderItemRouteCompleted(OrderItem orderItem, List<ProductionSchedule> itemSchedules) {
        boolean hasSMT = false;
        boolean hasDIP = false;
        boolean hasAssembly = false;
        boolean hasTesting = false;
        boolean hasPacking = false;

        for (ProductionSchedule s : itemSchedules) {
            if (!"COMPLETED".equalsIgnoreCase(s.getStatus())) {
                continue;
            }
            String lineName = s.getPlan().getLine().getLineName();
            String stage = stageKeyFromLineName(lineName);
            switch (stage) {
                case "SMT" -> hasSMT = true;
                case "DIP" -> hasDIP = true;
                case "ASSEMBLY" -> hasAssembly = true;
                case "TESTING" -> hasTesting = true;
                case "PACKING" -> hasPacking = true;
                default -> {
                }
            }
        }

        return hasSMT && hasDIP && hasAssembly && hasTesting && hasPacking;
    }

    private String stageKeyFromLineName(String lineName) {
        if (lineName == null) {
            return "OTHER";
        }
        String normalized = lineName.toUpperCase(Locale.ROOT);
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
            return "TESTING";
        }
        if (normalized.contains("PACK")) {
            return "PACKING";
        }
        return "OTHER";
    }

    private int stageRank(String stageKey) {
        return switch (stageKey) {
            case "SMT" -> 0;
            case "DIP" -> 1;
            case "ASSEMBLY" -> 2;
            case "TESTING" -> 3;
            case "PACKING" -> 4;
            default -> 99;
        };
    }
}

