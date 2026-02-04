package be.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "production_plan")
public class ProductionPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "plan_id", nullable = false)
    private Integer id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "line_id", nullable = false)
    private ProductionLine line;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private Employee createdBy;

    @NotNull
    @Column(name = "planned_quantity", nullable = false)
    private Integer plannedQuantity;

    @NotNull
    @Column(name = "planned_start_date", nullable = false)
    private LocalDate plannedStartDate;

    @Column(name = "planned_end_date")
    private LocalDate plannedEndDate;

    @Column(name = "estimated_hours")
    private Double estimatedHours;

    @Size(max = 30)
    @NotNull
    @Column(name = "decision", nullable = false, length = 30)
    private String decision;

    @Column(name = "note", length = Integer.MAX_VALUE)
    private String note;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @OneToMany
    @JoinColumn(name = "plan_id")
    private Set<ProductionSchedule> productionSchedules = new LinkedHashSet<>();

}