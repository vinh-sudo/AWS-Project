package be.backend.service.statistics;

import be.backend.model.dto.DateRange;
import be.backend.model.dto.projection.*;
import be.backend.model.response.statistics.*;
import be.backend.repository.IncidentLogRepository;
import be.backend.repository.ProductionScheduleRepository;
import be.backend.repository.ReportRepository;
import be.backend.service.utilities.OeeCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ManagerStatisticsService {

    private final ReportRepository reportRepo;
    private final ProductionScheduleRepository scheduleRepo;
    private final IncidentLogRepository incidentRepo;

    // ==================== PRODUCTION OVERVIEW ====================

    public ProductionOverviewResponse getProductionOverview(String range) {
        DateRange dr = DateRange.fromRange(range);

        ProductionSummaryProjection data = reportRepo.getProductionSummary(
                dr.getFrom(), dr.getTo());

        long good = data.getTotalGood();
        long reject = data.getTotalReject();
        long target = data.getTotalTarget();

        return ProductionOverviewResponse.builder()
                .totalGood(good)
                .totalReject(reject)
                .totalTarget(target)
                .totalDowntimeMinutes(data.getTotalDowntime())
                .achievementRate(target > 0
                        ? OeeCalculator.round((double) good / target)
                        : 0.0)
                .rejectRate((good + reject) > 0
                        ? OeeCalculator.round((double) reject / (good + reject))
                        : 0.0)
                .range(dr.rangeLabel())
                .build();
    }

    // ==================== OEE TREND ====================

    public OeeTrendResponse getOeeTrend(DateRange range) {
        List<OeeTrendProjection> data = reportRepo.getOeeTrend(
                range.getFrom(), range.getTo());

        List<OeeTrendResponse.OeeTrendItem> items = data.stream().map(row -> {
            double a = OeeCalculator.availability(
                    row.getShiftHours() * 60.0, row.getTotalDowntime());
            double p = OeeCalculator.performance(
                    row.getTotalGood(), row.getTotalTarget());
            double q = OeeCalculator.quality(
                    row.getTotalGood(), row.getTotalReject());

            return OeeTrendResponse.OeeTrendItem.builder()
                    .workDate(row.getWorkDate())
                    .availability(a)
                    .performance(p)
                    .quality(q)
                    .oee(OeeCalculator.oee(a, p, q))
                    .build();
        }).toList();

        return OeeTrendResponse.builder().items(items).build();
    }

    // ==================== LINE COMPARISON ====================

    public LineComparisonResponse getLineComparison(DateRange range) {
        List<LineComparisonProjection> data = reportRepo.getLineComparison(
                range.getFrom(), range.getTo());

        List<LineComparisonResponse.LineComparisonItem> items = data.stream().map(row -> {
            double oee = OeeCalculator.computeOee(
                    row.getShiftHours(),
                    row.getTotalDowntime(),
                    row.getTotalGood(),
                    row.getTotalReject(),
                    row.getTotalTarget());

            long total = row.getTotalGood() + row.getTotalReject();
            double yieldRate = total > 0
                    ? OeeCalculator.round((double) row.getTotalGood() / total)
                    : 0.0;

            return LineComparisonResponse.LineComparisonItem.builder()
                    .lineId(row.getLineId())
                    .lineName(row.getLineName())
                    .totalGood(row.getTotalGood())
                    .totalReject(row.getTotalReject())
                    .totalTarget(row.getTotalTarget())
                    .oee(oee)
                    .yieldRate(yieldRate)
                    .build();
        }).toList();

        return LineComparisonResponse.builder().lines(items).build();
    }

    // ==================== YIELD TREND ====================

    public YieldTrendResponse getYieldTrend(DateRange range) {
        List<OeeTrendProjection> data = reportRepo.getOeeTrend(
                range.getFrom(), range.getTo());

        List<YieldTrendResponse.YieldTrendItem> items = data.stream().map(row -> {
            long total = row.getTotalGood() + row.getTotalReject();
            return YieldTrendResponse.YieldTrendItem.builder()
                    .workDate(row.getWorkDate())
                    .goodRate(total > 0
                            ? OeeCalculator.round((double) row.getTotalGood() / total)
                            : 0.0)
                    .rejectRate(total > 0
                            ? OeeCalculator.round((double) row.getTotalReject() / total)
                            : 0.0)
                    .build();
        }).toList();

        return YieldTrendResponse.builder().items(items).build();
    }

    // ==================== SCHEDULE ADHERENCE ====================

    public ScheduleAdherenceResponse getScheduleAdherence(DateRange range) {
        ScheduleAdherenceProjection data = scheduleRepo.getAdherenceStats(
                range.toStartOffset(), range.toEndOffset());

        long total = data.getTotalSchedules();

        return ScheduleAdherenceResponse.builder()
                .totalSchedules(total)
                .completedCount(data.getCompletedCount())
                .runningCount(data.getRunningCount())
                .pausedCount(data.getPausedCount())
                .completionRate(total > 0
                        ? OeeCalculator.round((double) data.getCompletedCount() / total)
                        : 0.0)
                .build();
    }

    // ==================== INCIDENT SUMMARY ====================

    public IncidentSummaryStatsResponse getIncidentSummary(DateRange range) {
        List<IncidentStatsProjection> data = incidentRepo.getIncidentSummary(
                range.toStartOffset(), range.toEndOffset());

        long total = data.stream().mapToLong(IncidentStatsProjection::getCount).sum();

        List<IncidentSummaryStatsResponse.IncidentStatItem> breakdown = data.stream()
                .map(row -> IncidentSummaryStatsResponse.IncidentStatItem.builder()
                        .incidentType(row.getIncidentType())
                        .severity(row.getSeverity())
                        .count(row.getCount())
                        .build())
                .toList();

        return IncidentSummaryStatsResponse.builder()
                .totalIncidents(total)
                .breakdown(breakdown)
                .build();
    }
}