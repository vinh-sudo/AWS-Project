package be.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id", nullable = false)
    private Integer id;

    @Size(max = 100)
    @NotNull
    @Column(name = "customer_name", nullable = false, length = 100)
    private String customerName;

    @Size(max = 100)
    @NotNull
    @Column(name = "product_type", nullable = false, length = 100)
    private String productType;

    @NotNull
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "deadline")
    private OffsetDateTime deadline;

    @Size(max = 20)
    @Column(name = "priority", length = 20)
    private String priority;

    @Size(max = 20)
    @ColumnDefault("'Draft'")
    @Column(name = "status", length = 20)
    private String status;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @OneToMany
    @JoinColumn(name = "order_id")
    private Set<OrderItem> orderItems = new LinkedHashSet<>();

    @OneToMany
    @JoinColumn(name = "order_id")
    private Set<ProductionSchedule> productionSchedules = new LinkedHashSet<>();

}