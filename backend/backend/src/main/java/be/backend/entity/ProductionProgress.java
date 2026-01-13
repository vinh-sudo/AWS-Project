package be.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "production_progress")
public class ProductionProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "progress_id", nullable = false)
    private Integer id;

    @Column(name = "percentage", precision = 5, scale = 2)
    private BigDecimal percentage;

    @Size(max = 20)
    @ColumnDefault("'In Progress'")
    @Column(name = "status", length = 20)
    private String status;

}