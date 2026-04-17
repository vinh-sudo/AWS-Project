package be.backend.model.response;

import java.time.OffsetDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LogoutResponse {
    private String message;
    private OffsetDateTime logoutAt;
    private boolean success;
    
}
