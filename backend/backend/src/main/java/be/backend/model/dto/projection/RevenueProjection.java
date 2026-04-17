package be.backend.model.dto.projection;

import java.math.BigDecimal;

public interface RevenueProjection {
    BigDecimal getTotalRevenue();
    Long getTotalOrders();
}