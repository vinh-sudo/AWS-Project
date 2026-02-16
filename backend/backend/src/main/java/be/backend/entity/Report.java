package be.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Getter
@Setter
@Entity
@Table(name = "report")
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id", nullable = false)
    private Integer id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "line_id", nullable = false)
    private ProductionLine line;

    @NotNull
    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Size(max = 20)
    @Column(name = "shift", length = 20)
    private String shift;

    @Column(name = "downtime_minutes")
    private Integer downtimeMinutes;

    @Column(name = "notes", length = Integer.MAX_VALUE)
    private String notes;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "target_quantity", nullable = false)
    private Integer targetQuantity;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "good_quantity", nullable = false)
    private Integer goodQuantity;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "reject_quantity", nullable = false)
    private Integer rejectQuantity;

}