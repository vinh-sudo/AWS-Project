package be.backend.entity;

import be.backend.converter.ActionTypeConverter;
import be.backend.enums.ActionType;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "audit_log_archive")
public class AuditLogArchive {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id", nullable = false)
    private Integer id;

    @NotNull
    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @NotNull
    @Convert(converter = ActionTypeConverter.class)
    @Column(name = "action_type", nullable = false, length = 30)
    private ActionType actionType;

    @NotNull
    @Size(max = 50)
    @Column(name = "entity", nullable = false, length = 50)
    private String entity;

    @Column(name = "entity_id")
    private Integer entityId;

    @Size(max = 2048)
    @Column(name = "details", length = 2048)
    private String details;

    @NotNull
    @Column(name = "timestamp", nullable = false)
    private OffsetDateTime timestamp;

    @Size(max = 45)
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @NotNull
    @Column(name = "archived_at", nullable = false)
    private OffsetDateTime archivedAt;
}
