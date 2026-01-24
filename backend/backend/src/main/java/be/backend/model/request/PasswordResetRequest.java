package be.backend.model.request;

import lombok.Data;

@Data
public class PasswordResetRequest {
    private String employeeCode;
    private String otp;
    private String newPassword;
}
