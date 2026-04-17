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
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "machine")
public class Machine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "machine_id", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "line_id")
    private ProductionLine line;

    @Size(max = 100)
    @NotNull
    @Column(name = "machine_name", nullable = false, length = 100)
    private String machineName;

    @Size(max = 50)
    @Column(name = "machine_type", length = 50)
    private String machineType;

    @Column(name = "capacity")
    private Integer capacity;

    @Size(max = 20)
    @ColumnDefault("'active'")
    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "last_maintenance_date")
    private OffsetDateTime lastMaintenanceDate;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @ColumnDefault("1")
    @Column(name = "quantity")
    private Integer quantity;

    @Size(max = 100)
    @Column(name = "machine_code", length = 100)
    private String machineCode;

    @Size(max = 20)
    @Column(name = "runtime_status", length = 20)
    private String runtimeStatus;

    @OneToMany(mappedBy = "machine")
    private Set<IncidentLog> incidentLogs = new LinkedHashSet<>();

    @OneToMany(mappedBy = "machine")
    private Set<ProductionSchedule> productionSchedules = new LinkedHashSet<>();

}