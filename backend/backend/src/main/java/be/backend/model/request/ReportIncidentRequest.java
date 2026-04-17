package be.backend.model.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ReportIncidentRequest {

    @NotNull(message = "Schedule ID is required")
    private Integer scheduleId;

    private Integer machineId;  // nullable — sự cố không nhất thiết liên quan máy

    @NotBlank(message = "Incident type is required")
    @Size(max = 50)
    private String incidentType;

    @NotBlank(message = "Severity is required")
    @Pattern(regexp = "LOW|MEDIUM|HIGH",
             message = "Severity must be LOW, MEDIUM, or HIGH")
    private String severity;

    @NotBlank(message = "Description is required")
    private String description;
}