package be.backend.model.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Summary của 1 Incident
 * Dùng trong LeaderDashboardResponse
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentSummaryResponse {
    private Integer incidentId;
    private String incidentType;
    private String severity;
    private LocalDateTime timestamp;
}
