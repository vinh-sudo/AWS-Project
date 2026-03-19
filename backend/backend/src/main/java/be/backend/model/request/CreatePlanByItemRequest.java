package be.backend.model.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreatePlanByItemRequest {

    @NotNull(message = "orderId is required")
    private Integer orderId;

    @NotNull(message = "orderItemId is required")
    private Integer orderItemId;

    @NotNull(message = "plannedQty is required")
    @Min(value = 1, message = "plannedQty must be greater than 0")
    private Integer plannedQty;

    @NotBlank(message = "planName is required")
    private String planName;

    @NotNull(message = "startDate is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    private String note;
}

