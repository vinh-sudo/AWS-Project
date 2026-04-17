package be.backend.model.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor  // ← THÊM
@AllArgsConstructor
public class OrderItemResponse {
    private Integer id;
    private String productName;
    private Integer quantity;
    private BigDecimal price;
}