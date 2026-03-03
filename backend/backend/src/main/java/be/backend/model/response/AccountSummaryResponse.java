package be.backend.model.response;

import java.time.OffsetDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AccountSummaryResponse {
    private Integer id;
    private String username;
    private String employeeCode;
    private String role;
    private String status;
    private OffsetDateTime lastLogin;
}
