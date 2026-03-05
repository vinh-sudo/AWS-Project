package be.backend.controller.admin;

import be.backend.model.request.AssignLeaderRequest;
import be.backend.model.response.AccountSummaryResponse;
import be.backend.model.response.AssignmentResponse;
import be.backend.service.admin.AdminAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/assignments")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminAssignmentController {

    private final AdminAssignmentService assignmentService;

    /** Xem tất cả assignment đang ACTIVE */
    @GetMapping
    public ResponseEntity<List<AssignmentResponse>> getActiveAssignments() {
        return ResponseEntity.ok(assignmentService.getActiveAssignments());
    }

    /** Danh sách leader chưa gắn line (cho dropdown select) */
    @GetMapping("/available-leaders")
    public ResponseEntity<List<AccountSummaryResponse>> getAvailableLeaders() {
        return ResponseEntity.ok(assignmentService.getAvailableLeaders());
    }

    /** Gắn leader vào line */
    @PostMapping
    public ResponseEntity<AssignmentResponse> assignLeader(
            @Valid @RequestBody AssignLeaderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assignmentService.assignLeader(request));
    }

    /** Gỡ leader khỏi line */
    @PutMapping("/{id}/unassign")
    public ResponseEntity<AssignmentResponse> unassignLeader(@PathVariable Long id) {
        return ResponseEntity.ok(assignmentService.unassignLeader(id));
    }
}