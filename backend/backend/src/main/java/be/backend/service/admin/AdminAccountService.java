package be.backend.service.admin;

import be.backend.entity.Account;
import be.backend.enums.ActionType;
import be.backend.enums.Role;
import be.backend.event.AccountEvent;
import be.backend.exception.BusinessException;
import be.backend.exception.ResourceNotFoundException;
import be.backend.model.request.UpdateRoleRequest;
import be.backend.model.response.AccountSummaryResponse;
import be.backend.repository.AccountRepository;
import be.backend.service.utilities.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminAccountService {

    private final AccountRepository accountRepository;
    private final AuditLogService auditLogService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public Page<AccountSummaryResponse> getAccounts(String role, String search, int page, int size) {
        String validatedRole = null;
        if (role != null && !role.isBlank()) {
            Role.fromString(role);
            validatedRole = role.trim().toUpperCase();
        }

        String normalizedSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        Pageable pageable = PageRequest.of(page, size);

        return accountRepository.findAllWithFilters(validatedRole, normalizedSearch, pageable)
                .map(this::toSummary);
    }

    // ======================== 2. Edit role ========================
    
    @Transactional
    public AccountSummaryResponse updateRole(Integer accountId, UpdateRoleRequest request, 
                                             Account currentUser) {
        Account account = accountRepository.findById(accountId)
            .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        
        // Guard: do not modify admin accounts (string comparison)
        if ("ADMIN".equalsIgnoreCase(account.getRole())) {
            throw new BusinessException("Cannot change admin role");
        }
        
        // Capture the old value before changing it
        String oldRole = account.getRole();
        
        // Validate the new role (throws exception if invalid)
        Role newRoleEnum = Role.fromString(request.getRole());
        if (newRoleEnum == Role.ADMIN) {
            throw new BusinessException("Cannot assign ADMIN role");
        }
        String newRole = newRoleEnum.name();
        
        // Update role
        account.setRole(newRole);
        accountRepository.save(account);
        
        // Audit logging
        auditLogService.builder()
            .user(currentUser.getUser())
            .action(ActionType.CHANGE_ROLE)
            .entity("ACCOUNT")
            .entityId(accountId)
            .change("role", oldRole, newRole)
            .log();
        
        // Publish event
        eventPublisher.publishEvent(new AccountEvent.RoleChangedEvent(account, oldRole));
        return toSummary(account);
    }
    
    // ======================== 3. Lock ========================
    
    @Transactional
    public AccountSummaryResponse lockAccount(Integer accountId, Account currentUser) {
        Account account = accountRepository.findById(accountId)
            .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        
        // Guard: cannot lock the current user
        if (account.getId().equals(currentUser.getId())) {
            throw new BusinessException("Cannot lock your own account");
        }
        
        // Guard: admin accounts cannot be locked
        if ("ADMIN".equalsIgnoreCase(account.getRole())) {
            throw new BusinessException("Cannot lock admin account");
        }
        
        // Capture the old status for audit
        String oldStatus = account.getStatus();
        
        // Update status to "locked"
        account.setStatus("locked");
        account = accountRepository.save(account);
        
        // Audit logging with details
        auditLogService.builder()
            .user(currentUser.getUser())
            .action(ActionType.LOCK_ACCOUNT)
            .entity("ACCOUNT")
            .entityId(accountId)
            .change("status", oldStatus, "locked")
            .log();
        
        // Publish event
        eventPublisher.publishEvent(new AccountEvent.AccountLockedEvent(account));
        return toSummary(account);
    }
    
    // ======================== 4. Unlock ========================

    @Transactional
    public AccountSummaryResponse unlockAccount(Integer accountId, Account currentUser) {
        Account account = accountRepository.findById(accountId)
            .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        
        // Capture the old status
        String oldStatus = account.getStatus();

        // Update status to "active"
        account.setStatus("active");
        account = accountRepository.save(account);
        
        // Audit logging
        auditLogService.builder()
            .user(currentUser.getUser())
            .action(ActionType.UNLOCK_ACCOUNT)
            .entity("ACCOUNT")
            .entityId(accountId)
            .change("status", oldStatus, "active")
            .log();
        
        // AccountUnlockedEvent can be added later if needed
        return toSummary(account);
    }

    // ======================== Private helpers ========================

    private AccountSummaryResponse toSummary(Account a) {
        return AccountSummaryResponse.builder()
                .id(a.getId())
                .username(a.getUsername())
                .employeeCode(a.getEmployee() != null ? a.getEmployee().getEmployeeCode() : null)
                .role(a.getRole())
                .status(a.getStatus())
                .lastLogin(a.getLastLogin())
                .build();
    }
}