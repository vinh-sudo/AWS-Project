package be.backend.entity;

import be.backend.converter.ActionTypeConverter;
import be.backend.enums.ActionType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.OffsetDateTime;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "audit_log")
public class AuditLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id", nullable = false)
    private Integer id;

    /**
     * User thực hiện action
     * LAZY để tránh N+1 query
     */
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Action type enum (Type Safety + Storage Efficiency)
     */
    @NotNull
    @Convert(converter = ActionTypeConverter.class)
    @Column(name = "action_type", nullable = false, length = 30)
    private ActionType actionType;

    /**
     * Entity name: ORDER, ACCOUNT, PLAN, SCHEDULE
     * Uppercase convention
     */
    @NotNull
    @Size(max = 50)
    @Column(name = "entity", nullable = false, length = 50)
    private String entity;

    /**
     * ID của entity bị tác động
     * Query Optimization: Tìm logs của Order #123
     * Index: (entity, entity_id, timestamp)
     */
    @Column(name = "entity_id")
    private Integer entityId;

    /**
     * Details: CHỈ LƯU CHANGES, KHÔNG LƯU FULL OBJECT
     * Format JSON compact: {"changed":{"field":["old","new"]}}
     * Max 2048 chars → Prevent DB bloat
     * 
     * Nếu cần nhiều hơn → Store reference S3
     */
    @Size(max = 2048)
    @Column(name = "details", length = 2048)
    private String details;

    /**
     * Timestamp
     * Index để query range & archival job
     */
    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "\"timestamp\"", nullable = false)
    private OffsetDateTime timestamp;

    /**
     * IP address (Optional - for security audit)
     * Useful cho LOGIN_FAILED, CHANGE_ROLE, LOCK_ACCOUNT
     */
    @Size(max = 45)  // IPv6
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = OffsetDateTime.now();
        }
    }
}