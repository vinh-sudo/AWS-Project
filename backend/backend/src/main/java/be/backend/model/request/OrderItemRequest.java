package be.backend.model.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class OrderItemRequest {
    
    @NotBlank(message = "Product name is required")
    @Size(max = 100)
    private String productName;

    @NotNull(message = "Quantity is required")
    @Min(value = 1)
    private Integer quantity;

    @DecimalMin(value = "0.0")
    private BigDecimal price;
}