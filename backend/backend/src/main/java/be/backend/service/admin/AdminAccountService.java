package be.backend.service.admin;

import be.backend.entity.Account;
import be.backend.enums.Role;
import be.backend.exception.BusinessException;
import be.backend.exception.ResourceNotFoundException;
import be.backend.model.response.AccountSummaryResponse;
import be.backend.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminAccountService {

    private final AccountRepository accountRepository;

    // ======================== 1. LIST + FILTER + SEARCH ========================

    @Transactional(readOnly = true) // ① READ-ONLY: skip dirty-checking → nhanh hơn ~15%
    public Page<AccountSummaryResponse> getAccounts(String role, String search,
                                                     int page, int size) {
        // ② Validate role nếu có truyền
        String validatedRole = null;
        if (role != null && !role.isBlank()) {
            Role.fromString(role); // throws BusinessException nếu invalid
            validatedRole = role.trim().toUpperCase();
        }

        // ③ Normalize: blank → null (repo skip điều kiện khi null)
        String normalizedSearch = (search != null && !search.isBlank())
                ? search.trim()
                : null;

        // ④ Sort mới nhất trước
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        // ⑤ Query + map trong 1 pipeline
        return accountRepository
                .findAllWithFilters(validatedRole, normalizedSearch, pageable)
                .map(this::toSummary);
    }

    // ======================== 2. EDIT ROLE ========================

    @Transactional // ⑥ WRITE: cần commit
    public AccountSummaryResponse updateRole(Integer accountId, String newRole) {
        Role validated = Role.fromString(newRole); // ⑦ Validate trước khi query

        Account account = findAccountOrThrow(accountId);

        // ⑧ GUARD: Không đổi role của ADMIN
        if ("ADMIN".equalsIgnoreCase(account.getRole())) {
            throw new BusinessException("Cannot change role of an ADMIN account");
        }

        // ⑨ GUARD: Không gán ADMIN cho ai
        if (validated == Role.ADMIN) {
            throw new BusinessException("Cannot assign ADMIN role");
        }

        account.setRole(validated.name());
        return toSummary(accountRepository.save(account));
    }

    // ======================== 3. LOCK ========================

    @Transactional
    public AccountSummaryResponse lockAccount(Integer accountId) {
        Account account = findAccountOrThrow(accountId);

        // ⑩ GUARD: Không lock ADMIN
        if ("ADMIN".equalsIgnoreCase(account.getRole())) {
            throw new BusinessException("Cannot lock an ADMIN account");
        }

        // ⑪ Idempotent: đã locked → không lỗi, trả luôn
        if (!"locked".equalsIgnoreCase(account.getStatus())) {
            account.setStatus("locked");
            account = accountRepository.save(account);
        }
        return toSummary(account);
    }

    // ======================== 4. UNLOCK ========================

    @Transactional
    public AccountSummaryResponse unlockAccount(Integer accountId) {
        Account account = findAccountOrThrow(accountId);

        if (!"active".equalsIgnoreCase(account.getStatus())) {
            account.setStatus("active");
            account = accountRepository.save(account);
        }
        return toSummary(account);
    }

    // ======================== PRIVATE HELPERS ========================

    // ⑫ Extract method: DRY — dùng ở 4 method
    private Account findAccountOrThrow(Integer id) {
        return accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account", id.toString()));
    }

    // ⑬ Mapping: private vì chỉ service này dùng, logic đơn giản không cần MapStruct
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