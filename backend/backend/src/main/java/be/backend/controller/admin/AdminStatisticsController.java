package be.backend.controller.admin;

import be.backend.model.dto.DateRange;
import be.backend.model.response.statistics.*;
import be.backend.service.statistics.AdminStatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/statistics")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminStatisticsController {

    private final AdminStatisticsService statisticsService;

    @GetMapping("/order-overview")
    public ResponseEntity<OrderOverviewResponse> orderOverview() {
        return ResponseEntity.ok(statisticsService.getOrderOverview());
    }

    @GetMapping("/order-trend")
    public ResponseEntity<OrderTrendResponse> orderTrend(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "day") String groupBy) {
        return ResponseEntity.ok(
                statisticsService.getOrderTrend(DateRange.of(from, to), groupBy));
    }

    @GetMapping("/revenue-summary")
    public ResponseEntity<RevenueSummaryResponse> revenueSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(
                statisticsService.getRevenueSummary(DateRange.of(from, to)));
    }

    @GetMapping("/system-overview")
    public ResponseEntity<SystemOverviewResponse> systemOverview() {
        return ResponseEntity.ok(statisticsService.getSystemOverview());
    }
}