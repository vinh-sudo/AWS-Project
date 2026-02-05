package be.backend.model.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateUserRequest {
    
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @Size(max = 50)
    private String firstName;

    @Size(max = 50)
    private String lastName;

    @Email(message = "Invalid email format")
    @Size(max = 100)
    private String email;

    @Size(max = 15)
    private String phoneNumber;

    private String role;
}
