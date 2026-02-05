package be.backend.model.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {
    private Integer id;
    private Integer userId;
    private String userEmail;
    private String userName;
    private String actionType;
    private String entity;
    private String details;
    private OffsetDateTime timestamp;
}
