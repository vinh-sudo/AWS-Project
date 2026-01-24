package be.backend.model.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    
    @NotBlank(message = "First name is mandatory")
    @Size(max = 50, message = "First name must not exceed 50 characters")
    private String firstName;
    
    @NotBlank(message = "Last name is mandatory")
    @Size(max = 50, message = "Last name must not exceed 50 characters")
    private String lastName;
    
    @NotBlank(message = "Email is mandatory")
    @Email(message = "Email should be valid")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;
    
    @Pattern(regexp = "^\\d{10,15}$", message = "Phone number must be 10-15 digits")
    private String phoneNumber;
    
    // Thông tin Account
    @NotBlank(message = "Username is mandatory")
    @Size(min = 4, max = 100, message = "Username must be between 4 and 100 characters")
    private String username;
    
    @NotBlank(message = "Password is mandatory")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$",
        message = "Password must contain at least one uppercase, one lowercase, and one digit"
    )
    private String password;
    
    @NotBlank(message = "Role is mandatory")
    private String role;  // admin, manager, worker
    
    // Thông tin Employee (nếu role là employee-related)
    private String employeeCode;  // Optional - tự động generate
    private String position;
    
}
