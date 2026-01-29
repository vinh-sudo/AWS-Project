package be.backend.model.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
public class CreateOrderRequest {
    
    @NotBlank(message = "Customer name is required")
    @Size(max = 100)
    private String customerName;

    @NotBlank(message = "Product type is required")
    @Size(max = 100)
    private String productType;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    private OffsetDateTime deadline;

    private String priority; // Low, Medium, High, Urgent

    @Valid
    private List<OrderItemRequest> items;
}