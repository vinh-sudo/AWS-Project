package be.backend.model.ai;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AiDecisionResult {
    private String systemStatus;
    private String riskLevel;
    private List<String> findings;
    private List<String> evidence;
    private List<String> recommendations;
    private double confidence;
}
