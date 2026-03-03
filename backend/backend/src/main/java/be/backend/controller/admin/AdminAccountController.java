package be.backend.controller.admin;

import be.backend.model.request.UpdateRoleRequest;
import be.backend.model.response.AccountSummaryResponse;
import be.backend.service.admin.AdminAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/accounts")
@PreAuthorize("hasRole('ADMIN')")        // ① Class-level: TẤT CẢ endpoint chỉ ADMIN
@RequiredArgsConstructor
public class AdminAccountController {

    private final AdminAccountService adminAccountService;

    /**
     * List + Filter + Search
     * GET /api/admin/accounts                              → tất cả
     * GET /api/admin/accounts?role=MANAGER                 → filter
     * GET /api/admin/accounts?search=homin                 → search username
     * GET /api/admin/accounts?role=LINE_LEADER&search=abc  → kết hợp
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

    /** Edit role — body: {"role": "MANAGER"} */
    @PutMapping("/{id}/role")
    public ResponseEntity<AccountSummaryResponse> updateRole(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateRoleRequest request) {

        return ResponseEntity.ok(
                adminAccountService.updateRole(id, request.getRole()));
    }

    /** Lock account */
    @PutMapping("/{id}/lock")
    public ResponseEntity<AccountSummaryResponse> lockAccount(@PathVariable Integer id) {
        return ResponseEntity.ok(adminAccountService.lockAccount(id));
    }

    /** Unlock account */
    @PutMapping("/{id}/unlock")
    public ResponseEntity<AccountSummaryResponse> unlockAccount(@PathVariable Integer id) {
        return ResponseEntity.ok(adminAccountService.unlockAccount(id));
    }
}