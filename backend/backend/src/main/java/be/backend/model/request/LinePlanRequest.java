package be.backend.model.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LinePlanRequest {
    @NotNull(message = "lineId is required")
    private Long lineId;           // SMT, DIP, ASM...

    @NotNull(message = "plannedQty is required")
    @Min(value = 1, message = "plannedQty must be greater than 0")
    private Integer plannedQty;    // Manager nhập

    @NotNull(message = "orderItemId is required")
    private Integer orderItemId;   // Plan for which order item
}