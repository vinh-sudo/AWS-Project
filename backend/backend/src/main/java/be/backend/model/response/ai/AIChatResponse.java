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
}
