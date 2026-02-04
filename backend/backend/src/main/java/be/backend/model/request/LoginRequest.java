package be.backend.model.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest{
    @NotBlank(message = "Employee code is mandatory")
    private String employeeCode;
    @NotBlank(message = "Password is mandatory")
    private String password;
}