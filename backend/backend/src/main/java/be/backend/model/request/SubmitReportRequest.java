package be.backend.model.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SubmitReportRequest {

    @NotNull(message = "Schedule ID is required")
    private Integer scheduleId;

    @NotBlank(message = "Shift is required")
    @Pattern(regexp = "MORNING|AFTERNOON|NIGHT",
             message = "Shift must be MORNING, AFTERNOON, or NIGHT")
    private String shift;

    @NotNull(message = "Target quantity is required")
    @Min(value = 0, message = "Target quantity must be >= 0")
    private Integer targetQuantity;

    @NotNull(message = "Good quantity is required")
    @Min(value = 0, message = "Good quantity must be >= 0")
    private Integer goodQuantity;

    @NotNull(message = "Reject quantity is required")
    @Min(value = 0, message = "Reject quantity must be >= 0")
    private Integer rejectQuantity;

    @Min(value = 0, message = "Downtime must be >= 0")
    private Integer downtimeMinutes;

    @Size(max = 1000)
    private String notes;
}