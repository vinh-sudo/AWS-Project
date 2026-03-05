package be.backend.model.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignLeaderRequest {

    @NotNull(message = "Line ID is required")
    private Integer lineId;

    @NotNull(message = "Leader ID (employee_id) is required")
    private Integer leaderId;
}