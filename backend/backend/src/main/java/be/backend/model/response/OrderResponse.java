package be.backend.model.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor  
@AllArgsConstructor
public class OrderResponse {
    private Integer id;
    private Integer createdById;
    private String customerName;
    private String productType;
    private Integer quantity;
    private OffsetDateTime deadline;
    private String priority;
    private String status;
    private String createdByName;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private List<OrderItemResponse> items; // Dùng class riêng
    private BigDecimal totalPrice;
}