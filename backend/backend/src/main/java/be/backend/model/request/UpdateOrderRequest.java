package be.backend.model.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
public class UpdateOrderRequest {
    
    @Size(max = 100)
    private String customerName;

    @Size(max = 100)
    private String productType;

    @Min(value = 1)
    private Integer quantity;

    private OffsetDateTime deadline;

    private String priority;

    private String status;

    @Valid
    private List<OrderItemRequest> items;
}