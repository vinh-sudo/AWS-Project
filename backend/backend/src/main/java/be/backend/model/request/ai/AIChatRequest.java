package be.backend.model.request.ai;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AIChatRequest {
    private String message;
    private String sessionId;
    private String userId; // Optional for context
}
