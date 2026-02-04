package be.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.OffsetDateTime;

@Getter
@Setter
@Entity
@Table(name = "incident_log")
public class IncidentLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "incident_id", nullable = false)
    private Integer id;


    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "line_id", nullable = false)
    private ProductionLine line;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "schedule_id", nullable = false)
    private ProductionSchedule schedule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "machine_id")
    private Machine machine;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by")
    private Employee reportedBy;

    @Size(max = 50)
    @Column(name = "incident_type", length = 50)
    private String incidentType;

    @Size(max = 10)
    @Column(name = "severity", length = 10)
    private String severity;

    @NotNull
    @Column(name = "description", nullable = false, length = Integer.MAX_VALUE)
    private String description;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "\"timestamp\"")
    private OffsetDateTime timestamp;

}