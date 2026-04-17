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
public class AIRootCauseAnalysisResponse {
    private String primaryRootCause;
    private String confidence; // HIGH, MEDIUM, LOW
    private List<String> contributingFactors;
    private List<String> evidencePoints;
    private List<String> immediateActions;
    private List<String> preventiveActions;
}
