package be.backend.model.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LogoutRequest {
     @NotBlank(message = "Access token is required")
    private String accessToken;
    
    // Optional: Logout cả refresh token
    private String refreshToken;
}
