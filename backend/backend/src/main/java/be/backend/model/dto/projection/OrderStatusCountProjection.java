package be.backend.model.dto.projection;

public interface OrderStatusCountProjection {
    String getStatus();
    Long getCount();
}