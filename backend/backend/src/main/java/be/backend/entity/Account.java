package be.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "accounts")
public class Account implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "account_id", nullable = false)
    private Integer id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "user_id", nullable = false)
    private be.backend.entity.User user;

    @Size(max = 20)
    @NotNull
    @Column(name = "employee_code", nullable = false, length = 20)
    private String employeeCode;

    @Size(max = 100)
    @NotNull
    @Column(name = "username", nullable = false, length = 100)
    private String username;

    @Size(max = 255)
    @NotNull
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Size(max = 50)
    @NotNull
    @Column(name = "role", nullable = false, length = 50)
    private String role;

    @Column(name = "last_login")
    private OffsetDateTime lastLogin;

    @Size(max = 20)
    @ColumnDefault("'active'")
    @Column(name = "status", length = 20)
    private String status;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @Override
public Collection<? extends GrantedAuthority> getAuthorities() {
    // Trả về danh sách quyền của user
    // Chuyển role thành GrantedAuthority
    return List.of(() -> role);  // SỬA: Trả về role thật, không phải List.of()
    // Lambda () -> role tạo GrantedAuthority với getAuthority() return role
}

@Override
public String getPassword() {
    // QUAN TRỌNG: Phải return passwordHash để Spring Security verify
    return passwordHash;  // SỬA: Return passwordHash, không phải ""
}

@Override
public boolean isAccountNonExpired() {
    return true;  // Account không bao giờ hết hạn
}

@Override
public boolean isAccountNonLocked() {
    // Chỉ active mới không bị lock
    return "active".equals(status);  // SỬA: Check status
}

@Override
public boolean isCredentialsNonExpired() {
    return true;  // Credentials không hết hạn
}

@Override
public boolean isEnabled() {
    // Chỉ active mới enable
    return "active".equals(status);  // SỬA: Check status
}

}