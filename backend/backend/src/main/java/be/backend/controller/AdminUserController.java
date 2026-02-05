package be.backend.controller;

import be.backend.entity.Account;
import be.backend.entity.User;
import be.backend.model.request.CreateUserRequest;
import be.backend.model.request.UpdateUserRequest;
import be.backend.model.response.UserResponse;
import be.backend.repository.AccountRepository;
import be.backend.repository.UserRepository;
import be.backend.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Get all users with their account info
     */
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<Account> accounts = accountRepository.findAll();
        List<UserResponse> response = accounts.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    /**
     * Get user by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Integer id) {
        Account account = accountRepository.findById(id.longValue())
                .orElseThrow(() -> new BusinessException("User not found"));
        return ResponseEntity.ok(mapToResponse(account));
    }

    /**
     * Create new user
     */
    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        // Check if username already exists
        if (accountRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("Username already exists");
        }

        // Create User entity
        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setStatus("active");
        user.setCreatedAt(OffsetDateTime.now());
        user.setUpdatedAt(OffsetDateTime.now());
        
        User savedUser = userRepository.save(user);

        // Create Account entity
        Account account = new Account();
        account.setUser(savedUser);
        account.setUsername(request.getUsername());
        account.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        account.setRole(request.getRole());
        account.setStatus("active");
        account.setCreatedAt(OffsetDateTime.now());
        account.setUpdatedAt(OffsetDateTime.now());

        Account savedAccount = accountRepository.save(account);

        return ResponseEntity.status(HttpStatus.CREATED).body(mapToResponse(savedAccount));
    }

    /**
     * Update user
     */
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateUserRequest request) {
        
        Account account = accountRepository.findById(id.longValue())
                .orElseThrow(() -> new BusinessException("User not found"));

        // Update User entity if exists
        if (account.getUser() != null) {
            User user = account.getUser();
            if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
            if (request.getLastName() != null) user.setLastName(request.getLastName());
            if (request.getEmail() != null) user.setEmail(request.getEmail());
            if (request.getPhoneNumber() != null) user.setPhoneNumber(request.getPhoneNumber());
            user.setUpdatedAt(OffsetDateTime.now());
            userRepository.save(user);
        }

        // Update Account entity
        if (request.getRole() != null) account.setRole(request.getRole());
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            account.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        account.setUpdatedAt(OffsetDateTime.now());

        Account savedAccount = accountRepository.save(account);

        return ResponseEntity.ok(mapToResponse(savedAccount));
    }

    /**
     * Delete user
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer id) {
        Account account = accountRepository.findById(id.longValue())
                .orElseThrow(() -> new BusinessException("User not found"));
        
        // Delete user if exists
        if (account.getUser() != null) {
            userRepository.delete(account.getUser());
        }
        
        accountRepository.delete(account);
        
        return ResponseEntity.noContent().build();
    }

    /**
     * Update user status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<UserResponse> updateUserStatus(
            @PathVariable Integer id,
            @RequestBody java.util.Map<String, String> body) {
        
        String status = body.get("status");
        if (status == null || (!status.equals("active") && !status.equals("blocked"))) {
            throw new BusinessException("Invalid status. Must be 'active' or 'blocked'");
        }

        Account account = accountRepository.findById(id.longValue())
                .orElseThrow(() -> new BusinessException("User not found"));

        account.setStatus(status);
        account.setUpdatedAt(OffsetDateTime.now());
        
        if (account.getUser() != null) {
            account.getUser().setStatus(status);
            account.getUser().setUpdatedAt(OffsetDateTime.now());
            userRepository.save(account.getUser());
        }

        Account savedAccount = accountRepository.save(account);

        return ResponseEntity.ok(mapToResponse(savedAccount));
    }

    /**
     * Get users by role
     */
    @GetMapping("/role/{role}")
    public ResponseEntity<List<UserResponse>> getUsersByRole(@PathVariable String role) {
        List<Account> accounts = accountRepository.findAll().stream()
                .filter(a -> a.getRole().equalsIgnoreCase(role))
                .collect(Collectors.toList());
        List<UserResponse> response = accounts.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    private UserResponse mapToResponse(Account account) {
        User user = account.getUser();
        return UserResponse.builder()
                .id(account.getId())
                .username(account.getUsername())
                .email(user != null ? user.getEmail() : null)
                .firstName(user != null ? user.getFirstName() : null)
                .lastName(user != null ? user.getLastName() : null)
                .fullName(user != null ? user.getFirstName() + " " + user.getLastName() : account.getUsername())
                .phoneNumber(user != null ? user.getPhoneNumber() : null)
                .role(account.getRole())
                .status(account.getStatus())
                .lastLogin(account.getLastLogin())
                .createdAt(account.getCreatedAt())
                .updatedAt(account.getUpdatedAt())
                .build();
    }
}
