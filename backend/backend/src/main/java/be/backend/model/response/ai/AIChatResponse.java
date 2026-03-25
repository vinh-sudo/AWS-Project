package be.backend.model.response.ai;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AIChatResponse {
    private String response;
    private String sessionId;
    private LocalDateTime timestamp;
    private boolean success;
    private List<String> suggestedQuestions; // Follow-up questions
    private String responseType; // TEXT, CHART, TABLE, etc.
    private String systemStatus; // STABLE, WARNING, CRITICAL
    private String riskLevel; // LOW, MEDIUM, HIGH
    private List<String> recommendations;
    private List<String> evidence;
    private Double confidence; // 0.0 - 1.0
    private String roleScope; // ADMIN, MANAGER, UNKNOWN
}
