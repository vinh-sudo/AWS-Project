package be.backend.service.statistics;

import be.backend.exception.BusinessException;
import be.backend.model.dto.DateRange;
import be.backend.model.dto.projection.OrderStatusCountProjection;
import be.backend.model.dto.projection.OrderTrendProjection;
import be.backend.model.dto.projection.RevenueProjection;
import be.backend.model.response.statistics.*;
import be.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AdminStatisticsService {

        private final OrderRepository orderRepo;
        private final AccountRepository accountRepo;
        private final EmployeeRepository employeeRepo;
        private final ProductionLineRepository lineRepo;
        private final MachineRepository machineRepo;

        private static final Set<String> VALID_GROUP_BY = Set.of("day", "week", "month");

        // ==================== ORDER OVERVIEW ====================

        public OrderOverviewResponse getOrderOverview() {
                List<OrderStatusCountProjection> data = orderRepo.getOrderStatusCounts();

                Map<String, Long> countByStatus = new LinkedHashMap<>();
                long total = 0;
                for (OrderStatusCountProjection row : data) {
                        countByStatus.put(row.getStatus(), row.getCount());
                        total += row.getCount();
                }

                return OrderOverviewResponse.builder()
                                .totalOrders(total)
                                .countByStatus(countByStatus)
                                .build();
        }

        // ==================== ORDER TREND ====================

        public OrderTrendResponse getOrderTrend(DateRange range, String groupBy) {
                String unit = (groupBy != null) ? groupBy.toLowerCase().trim() : "day";
                if (!VALID_GROUP_BY.contains(unit)) {
                        throw new BusinessException(
                                        "Invalid groupBy: " + groupBy + ". Valid: " + VALID_GROUP_BY);
                }

                List<OrderTrendProjection> data = orderRepo.getOrderTrend(
                                range.toStartOffset(), range.toEndOffset(), unit);

                List<OrderTrendResponse.OrderTrendItem> items = data.stream()
                                .map(row -> OrderTrendResponse.OrderTrendItem.builder()
                                                .period(row.getPeriod())
                                                .orderCount(row.getOrderCount())
                                                .totalQuantity(row.getTotalQuantity())
                                                .build())
                                .toList();

                return OrderTrendResponse.builder().items(items).build();
        }

        // ==================== REVENUE SUMMARY ====================

        public RevenueSummaryResponse getRevenueSummary(DateRange range) {
                RevenueProjection data = orderRepo.getRevenueSummary(
                                range.toStartOffset(), range.toEndOffset());

                BigDecimal revenue = data.getTotalRevenue() != null
                                ? data.getTotalRevenue()
                                : BigDecimal.ZERO;
                long orders = data.getTotalOrders() != null
                                ? data.getTotalOrders()
                                : 0;
                BigDecimal avg = orders > 0
                                ? revenue.divide(BigDecimal.valueOf(orders), 2, RoundingMode.HALF_UP)
                                : BigDecimal.ZERO;

                return RevenueSummaryResponse.builder()
                                .totalRevenue(revenue)
                                .totalOrders(orders)
                                .averageOrderValue(avg)
                                .build();
        }

        // ==================== SYSTEM OVERVIEW ====================

        public SystemOverviewResponse getSystemOverview() {
                long totalAccounts = accountRepo.count();
                long activeAccounts = accountRepo.countByStatusIgnoreCase("active");
                long blockedAccounts = accountRepo.countByStatusIgnoreCase("locked");

                return SystemOverviewResponse.builder()
                                .totalUsers(totalAccounts)
                                .activeUsers(activeAccounts)
                                .blockedUsers(blockedAccounts)
                                .totalEmployees(employeeRepo.count())
                                .totalLines(lineRepo.count())
                                .activeLines(lineRepo.countByStatus("active"))
                                .totalMachines(machineRepo.count())
                                .activeMachines(machineRepo.countByStatus("active"))
                                .build();
        }
}