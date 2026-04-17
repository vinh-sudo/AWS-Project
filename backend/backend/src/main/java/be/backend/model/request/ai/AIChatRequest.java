package be.backend.model.request.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AIChatRequest {
    @NotBlank(message = "message is required")
    @Size(max = 2000, message = "message length must be <= 2000")
    private String message;

    @Size(max = 128, message = "sessionId length must be <= 128")
    private String sessionId;

    @Size(max = 128, message = "userId length must be <= 128")
    private String userId; // Optional for context
}
