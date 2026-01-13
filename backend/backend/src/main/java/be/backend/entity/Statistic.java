package be.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "statistic")
public class Statistic {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "statistic_id", nullable = false)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "line_id")
    private ProductionLine line;

    @NotNull
    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "output")
    private Integer output;

    @Column(name = "downtime")
    private Integer downtime;

    @Column(name = "efficiency", precision = 5, scale = 2)
    private BigDecimal efficiency;

}