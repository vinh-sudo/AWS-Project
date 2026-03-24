package be.backend.service.leader;

import be.backend.entity.Account;
import be.backend.entity.LineLeaderAssignment;
import be.backend.entity.OrderItem;
import be.backend.entity.ProductionLine;
import be.backend.entity.ProductionSchedule;
import be.backend.model.dto.projection.ProductionSummaryProjection;
import be.backend.model.response.LeaderDashboardResponse;
import be.backend.model.response.ScheduleSummaryResponse;
import be.backend.exception.ResourceNotFoundException;
import be.backend.exception.ForbiddenException;
import be.backend.repository.IncidentLogRepository;
import be.backend.repository.LineLeaderAssignmentRepository;
import be.backend.repository.ProductionScheduleRepository;
import be.backend.repository.ReportRepository;
import java.util.stream.Collectors;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) // Toàn bộ class chỉ đọc → Spring optimize connection
public class LeaderDashboardService {

    private final LineLeaderAssignmentRepository assignmentRepo;
    private final ProductionScheduleRepository scheduleRepo;
    private final ReportRepository reportRepo;
    private final IncidentLogRepository incidentRepo;

    public LeaderDashboardResponse getDashboard(Account account) {

        // 1. Xác minh leader + lấy line đang quản lý
        LineLeaderAssignment assignment = resolveAssignment(account);
        ProductionLine line = assignment.getLine();
        Integer lineId = line.getId();

        // 2. Aggregate từng phần
        ProductionSummaryProjection todaySummary = fetchTodaySummary(lineId);
        List<ScheduleSummaryResponse> schedules = fetchActiveSchedules(lineId);
        long incidentCount = countUnresolvedIncidents(lineId);

        // 3. Tính efficiency: goodQty / targetQty * 100
        BigDecimal efficiency = calculateEfficiency(
                todaySummary.getTotalGood(),
                todaySummary.getTotalTarget());

        // 4. Build response — Builder pattern giữ code clean khi có nhiều field
        return LeaderDashboardResponse.builder()
                .lineId(lineId)
                .lineName(line.getLineName())
                .todayProducedQuantity(todaySummary.getTotalGood().intValue())
                .todayDowntimeMinutes(todaySummary.getTotalDowntime().intValue())
                .todayEfficiency(efficiency)
                .activeScheduleCount(schedules.size())
                .activeSchedules(schedules)
                .unresolvedIncidentCount((int) incidentCount)
                .build();
    }

    /**
     * Lấy danh sách schedule active của line mà leader quản lý
     * → Dùng cho endpoint GET /api/leader/schedules
     */
    public List<ScheduleSummaryResponse> getMySchedules(Account account) {
        LineLeaderAssignment assignment = resolveAssignment(account);
        return fetchActiveSchedules(assignment.getLine().getId());
    }

    private LineLeaderAssignment resolveAssignment(Account account) {
        if (account.getEmployee() == null) {
            throw new ForbiddenException("Account is not linked to any employee");
        }

        Integer employeeId = account.getEmployee().getId();

        return assignmentRepo.findActiveByLeaderId(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No active line assignment found for employee " + employeeId));
    }

    /**
     * WHY dùng native query projection (ProductionSummaryProjection)?
     * → SUM() / COALESCE() chạy nhanh hơn load tất cả Report rồi tính trong Java
     * → Database engine optimize aggregation tốt hơn application layer
     */
    private ProductionSummaryProjection fetchTodaySummary(Integer lineId) {
        return reportRepo.getTodaySummaryByLineId(lineId, LocalDate.now());
    }

    /**
     * Map ProductionSchedule entity → ScheduleSummaryResponse DTO
     * 
     * WHY không dùng MapStruct ở đây?
     * → ScheduleSummaryResponse có field "orderInfo" = custom concat, không phải
     * map 1:1
     * → Logic đơn giản → manual mapping rõ ràng hơn tạo thêm Mapper class
     * 
     * WHY JOIN FETCH trong query?
     * → findActiveByLineId() đã JOIN FETCH order, machine, plan, line
     * → Tránh N+1: nếu không fetch, mỗi s.getOrder() sẽ trigger thêm 1 query
     */
    private List<ScheduleSummaryResponse> fetchActiveSchedules(Integer lineId) {
        List<ProductionSchedule> schedules = scheduleRepo.findActiveByLineId(lineId);

        return schedules.stream()
                .map(s -> {
                    // Concat tên sản phẩm từ tất cả items của order
                    // VD: "Áo polo, Quần kaki" hoặc "Ghế gỗ" (nếu 1 item)
                    String productNames = s.getOrder().getItems().stream()
                            .map(OrderItem::getProductName)
                            .collect(Collectors.joining(", "));

                    // Lấy planned quantity
                    Integer plannedQty = s.getPlan() != null ? s.getPlan().getPlannedQuantity() : null;

                    // Xác định công đoạn trước (previous stage)
                    Integer previousStageGoodQuantity = null;
                    if (s.getPlan() != null && s.getPlan().getOrderItem() != null && s.getPlan().getLine() != null) {
                        OrderItem orderItem = s.getPlan().getOrderItem();
                        String currentLineName = s.getPlan().getLine().getLineName();
                        int currentRank = routeRank(currentLineName);
                        if (currentRank > 0 && currentRank < 99) {
                            // Tìm schedule công đoạn trước (rank - 1) cho cùng order item
                            List<ProductionSchedule> allSchedules = scheduleRepo.findByOrderId(orderItem.getOrder().getId());
                            ProductionSchedule prevStageSchedule = allSchedules.stream()
                                .filter(ps -> ps.getPlan() != null
                                        && ps.getPlan().getOrderItem() != null
                                        && ps.getPlan().getOrderItem().getId().equals(orderItem.getId())
                                        && ps.getPlan().getLine() != null
                                        && routeRank(ps.getPlan().getLine().getLineName()) == (currentRank - 1))
                                .findFirst().orElse(null);
                            if (prevStageSchedule != null) {
                                Long goodQty = reportRepo.sumGoodQuantityByScheduleId(prevStageSchedule.getId());
                                previousStageGoodQuantity = goodQty != null ? goodQty.intValue() : 0;
                            }
                        }
                    }

                    return ScheduleSummaryResponse.builder()
                            .scheduleId(s.getId())
                            .orderInfo(s.getOrder().getId() + " - " + productNames)
                            .status(s.getStatus())
                            .startTime(s.getStartTime().toLocalDateTime())
                            .endTime(s.getEndTime().toLocalDateTime())
                            .orderItemId(s.getPlan() != null && s.getPlan().getOrderItem() != null ? s.getPlan().getOrderItem().getId() : null)
                            .plannedQuantity(plannedQty)
                            .previousStageGoodQuantity(previousStageGoodQuantity)
                            .percentage(calculateSchedulePercentage(s))
                            .orderCompletionPercentage(calculateOrderCompletionPercentage(s))
                            .build();
                })
                .toList();
    }

    private BigDecimal calculateSchedulePercentage(ProductionSchedule schedule) {
        Integer plannedQty = schedule.getPlan().getPlannedQuantity();
        if (plannedQty == null || plannedQty <= 0) {
            return BigDecimal.ZERO;
        }

        Long producedQtyRaw = reportRepo.sumGoodQuantityByScheduleId(schedule.getId());
        long producedQty = producedQtyRaw == null ? 0L : producedQtyRaw;

        BigDecimal percentage = BigDecimal.valueOf(producedQty)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(plannedQty), 2, RoundingMode.HALF_UP);

        return percentage.min(BigDecimal.valueOf(100));
    }

    private BigDecimal calculateOrderCompletionPercentage(ProductionSchedule schedule) {
        Integer orderQuantity = schedule.getOrder().getQuantity();
        if (orderQuantity == null || orderQuantity <= 0) {
            return BigDecimal.ZERO;
        }

        Long producedQtyRaw = reportRepo.sumGoodQuantityByOrderId(schedule.getOrder().getId());
        long producedQty = producedQtyRaw == null ? 0L : producedQtyRaw;

        BigDecimal percentage = BigDecimal.valueOf(producedQty)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(orderQuantity), 2, RoundingMode.HALF_UP);

        return percentage.min(BigDecimal.valueOf(100));
    }

    /**
     * Đếm incident trong 24h gần nhất
     * 
     * WHY 24h thay vì "today"?
     * → Ca đêm (NIGHT shift) có thể bắt đầu 22:00 hôm qua → kết thúc 06:00 hôm nay
     * → Nếu dùng LocalDate.now() sẽ miss incident ca đêm
     * → 24h rolling window bao phủ mọi ca
     */
    private long countUnresolvedIncidents(Integer lineId) {
        OffsetDateTime since = OffsetDateTime.now().minusHours(24);
        return incidentRepo.countByLineIdAndTimestampAfter(lineId, since);
    }

    /**
     * WHY tách ra method riêng thay vì inline?
     * → Logic chia + xử lý edge case (target = 0) → nên isolate
     * → Có thể reuse ở service khác (VD: statistics)
     * 
     * WHY trả về BigDecimal thay vì double?
     * → Precision: double 33.333333... → BigDecimal(33.33) chính xác
     * → DTO dùng BigDecimal → nhất quán
     */
    private BigDecimal calculateEfficiency(Long good, Long target) {
        if (target == null || target == 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(good)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(target), 2, RoundingMode.HALF_UP);
    }
}