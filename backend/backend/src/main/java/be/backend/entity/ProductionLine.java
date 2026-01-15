package be.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "production_line")
public class ProductionLine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "line_id", nullable = false)
    private Integer id;

    @Size(max = 100)
    @NotNull
    @Column(name = "line_name", nullable = false, length = 100)
    private String lineName;

    @Column(name = "capacity")
    private Integer capacity;

    @Column(name = "shift_hours")
    private Integer shiftHours;

    @Column(name = "efficiency", precision = 5, scale = 2)
    private BigDecimal efficiency;

    @Size(max = 20)
    @ColumnDefault("'active'")
    @Column(name = "status", length = 20)
    private String status;

    @OneToMany
    @JoinColumn(name = "line_id")
    private Set<IncidentLog> incidentLogs = new LinkedHashSet<>();

    @OneToMany
    @JoinColumn(name = "line_id")
    private Set<Machine> machines = new LinkedHashSet<>();

    @OneToMany
    @JoinColumn(name = "line_id")
    private Set<ProductionSchedule> productionSchedules = new LinkedHashSet<>();

    @OneToMany
    @JoinColumn(name = "line_id")
    private Set<Report> reports = new LinkedHashSet<>();

    @OneToMany
    @JoinColumn(name = "line_id")
    private Set<Statistic> statistics = new LinkedHashSet<>();

}