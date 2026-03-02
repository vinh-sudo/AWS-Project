package be.backend.model.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class UpdateProgressRequest {

    @NotNull(message = "Schedule ID is required")
    private Integer scheduleId;

    @NotNull(message = "Percentage is required")
    @DecimalMin(value = "0.0", message = "Percentage must be >= 0")
    @DecimalMax(value = "100.0", message = "Percentage must be <= 100")
    private BigDecimal percentage;

    @Size(max = 500, message = "Note must not exceed 500 characters")
    private String note;
}