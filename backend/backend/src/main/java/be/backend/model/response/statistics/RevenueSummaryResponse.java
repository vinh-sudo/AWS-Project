package be.backend.model.response.statistics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueSummaryResponse {
    private BigDecimal totalRevenue;
    private long totalOrders;
    private BigDecimal averageOrderValue;
}