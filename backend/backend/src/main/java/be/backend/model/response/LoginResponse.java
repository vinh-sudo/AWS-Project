package be.backend.model.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponse{
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private Long expiresIn;

    //info user
    private Long id;
    private String emplyeeCode;
    private String username;
    private String fullName;
    private String role;
    private String email;
}
