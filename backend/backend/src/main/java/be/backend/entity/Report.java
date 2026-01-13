package be.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

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

    @Size(max = 50)
    @Column(name = "report_type", length = 50)
    private String reportType;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "generated_at")
    private OffsetDateTime generatedAt;

    @Column(name = "data", length = Integer.MAX_VALUE)
    private String data;

}