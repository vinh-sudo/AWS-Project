package be.backend.model.response;

import java.time.OffsetDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RegisterResponse {
    private Integer userId;
    private Integer accountId;
    private String username;
    private String email;
    private String fullName;
    private String employeeCode;  
    private String role;
    private String status;
    private OffsetDateTime createdAt;
    private String message;      
}
