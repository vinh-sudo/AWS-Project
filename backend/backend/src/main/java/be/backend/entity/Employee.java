package be.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "employee")
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "employee_id", nullable = false)
    private Integer id;

    @NotNull
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Size(max = 20)
    @NotNull
    @Column(name = "employee_code", nullable = false, length = 20)
    private String employeeCode;

    @Size(max = 50)
    @Column(name = "\"position\"", length = 50)
    private String position;

    @Size(max = 30)
    @NotNull
    @ColumnDefault("'WORKER'")
    @Column(name = "employee_type", nullable = false, length = 30)
    private String employeeType;

    @Size(max = 20)
    @ColumnDefault("'active'")
    @Column(name = "status", length = 20)
    private String status;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Account account;

    @OneToMany
    @JoinColumn(name = "reported_by")
    private Set<IncidentLog> incidentLogs = new LinkedHashSet<>();


    @OneToMany
    @JoinColumn(name = "employee_id")
    private Set<Report> reports = new LinkedHashSet<>();

}