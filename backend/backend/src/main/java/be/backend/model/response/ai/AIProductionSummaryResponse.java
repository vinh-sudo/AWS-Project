package be.backend.model.response.ai;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AIProductionSummaryResponse {
    private String overallStatus;   // STABLE | WARNING | CRITICAL
    private String mainIssue;
    private List<String> criticalLines;
    private List<String> recommendations;
}
