package be.backend.model.response;

import be.backend.enums.ActionType;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class AuditLogResponse {
    private Integer id;
    private Integer userId;
    private ActionType actionType;
    private String entity;
    private Integer entityId;
    private String details;
    private OffsetDateTime timestamp;
    private String ipAddress;
}
