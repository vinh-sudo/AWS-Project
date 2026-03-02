package be.backend.model.dto.projection;

public interface OrderTrendProjection {
    String getPeriod();
    Long getOrderCount();
    Long getTotalQuantity();
}