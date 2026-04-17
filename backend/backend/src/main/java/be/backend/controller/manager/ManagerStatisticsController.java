package be.backend.controller.manager;

import be.backend.model.dto.DateRange;
import be.backend.model.response.statistics.*;
import be.backend.service.statistics.ManagerStatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/manager/statistics")
@PreAuthorize("hasRole('MANAGER')")
@RequiredArgsConstructor
public class ManagerStatisticsController {

    private final ManagerStatisticsService statisticsService;

    @GetMapping("/production-overview")
    public ResponseEntity<ProductionOverviewResponse> productionOverview(
            @RequestParam(defaultValue = "TODAY") String range) {
        return ResponseEntity.ok(statisticsService.getProductionOverview(range));
    }

    @GetMapping("/oee-trend")
    public ResponseEntity<OeeTrendResponse> oeeTrend(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(statisticsService.getOeeTrend(DateRange.of(from, to)));
    }

    @GetMapping("/line-comparison")
    public ResponseEntity<LineComparisonResponse> lineComparison(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(statisticsService.getLineComparison(DateRange.of(from, to)));
    }

    @GetMapping("/yield-trend")
    public ResponseEntity<YieldTrendResponse> yieldTrend(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(statisticsService.getYieldTrend(DateRange.of(from, to)));
    }

    @GetMapping("/schedule-adherence")
    public ResponseEntity<ScheduleAdherenceResponse> scheduleAdherence(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(
                statisticsService.getScheduleAdherence(DateRange.of(from, to)));
    }

    @GetMapping("/incident-summary")
    public ResponseEntity<IncidentSummaryStatsResponse> incidentSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(
                statisticsService.getIncidentSummary(DateRange.of(from, to)));
    }
}