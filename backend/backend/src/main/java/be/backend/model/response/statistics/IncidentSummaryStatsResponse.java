package be.backend.model.response.statistics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentSummaryStatsResponse {
    private long totalIncidents;
    private List<IncidentStatItem> breakdown;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IncidentStatItem {
        private String incidentType;
        private String severity;
        private long count;
    }
}