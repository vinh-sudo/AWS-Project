package be.backend.controller.admin;

import be.backend.entity.Account;
import be.backend.model.request.UpdateRoleRequest;
import be.backend.model.response.AccountSummaryResponse;
import be.backend.service.admin.AdminAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/accounts")
@PreAuthorize("hasRole('ADMIN')")        // ① Class-level: all endpoints are admin-only
@RequiredArgsConstructor
public class AdminAccountController {

    private final AdminAccountService adminAccountService;

    /**
     * List + Filter + Search
        * GET /api/admin/accounts                              → all accounts
     * GET /api/admin/accounts?role=MANAGER                 → filter
     * GET /api/admin/accounts?search=homin                 → search username
        * GET /api/admin/accounts?role=LINE_LEADER&search=abc  → combined filter
     */
    @GetMapping
    public ResponseEntity<Page<AccountSummaryResponse>> getAccounts(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(
                adminAccountService.getAccounts(role, search, page, size));
    }

    /** Edit role - body: {"role": "MANAGER"} */
    @PutMapping("/{id}/role")
    public ResponseEntity<AccountSummaryResponse> updateRole(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateRoleRequest request,
            @AuthenticationPrincipal Account currentUser) {

        return ResponseEntity.ok(
                adminAccountService.updateRole(id, request, currentUser));
    }

    /** Lock account */
    @PutMapping("/{id}/lock")
    public ResponseEntity<AccountSummaryResponse> lockAccount(
            @PathVariable Integer id,
            @AuthenticationPrincipal Account currentUser) {
        return ResponseEntity.ok(adminAccountService.lockAccount(id, currentUser));
    }

    /** Unlock account */
    @PutMapping("/{id}/unlock")
    public ResponseEntity<AccountSummaryResponse> unlockAccount(
            @PathVariable Integer id,
            @AuthenticationPrincipal Account currentUser) {
        return ResponseEntity.ok(adminAccountService.unlockAccount(id, currentUser));
    }
}