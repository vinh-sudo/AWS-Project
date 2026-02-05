package be.backend.controller;

import be.backend.entity.AuditLog;
import be.backend.model.response.AuditLogResponse;
import be.backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    /**
     * Get all audit logs
     */
    @GetMapping
    public ResponseEntity<List<AuditLogResponse>> getAllAuditLogs() {
        List<AuditLog> logs = auditLogRepository.findAllByOrderByTimestampDesc();
        List<AuditLogResponse> response = logs.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    /**
     * Get audit logs by user ID
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AuditLogResponse>> getAuditLogsByUser(@PathVariable Integer userId) {
        List<AuditLog> logs = auditLogRepository.findByUserIdOrderByTimestampDesc(userId);
        List<AuditLogResponse> response = logs.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    /**
     * Get audit logs by action type
     */
    @GetMapping("/action/{actionType}")
    public ResponseEntity<List<AuditLogResponse>> getAuditLogsByAction(@PathVariable String actionType) {
        List<AuditLog> logs = auditLogRepository.findByActionTypeOrderByTimestampDesc(actionType);
        List<AuditLogResponse> response = logs.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    /**
     * Get audit logs by entity
     */
    @GetMapping("/entity/{entity}")
    public ResponseEntity<List<AuditLogResponse>> getAuditLogsByEntity(@PathVariable String entity) {
        List<AuditLog> logs = auditLogRepository.findByEntityOrderByTimestampDesc(entity);
        List<AuditLogResponse> response = logs.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    private AuditLogResponse mapToResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .userId(log.getUser() != null ? log.getUser().getId() : null)
                .userEmail(log.getUser() != null ? log.getUser().getEmail() : null)
                .userName(log.getUser() != null 
                        ? log.getUser().getFirstName() + " " + log.getUser().getLastName() 
                        : null)
                .actionType(log.getActionType())
                .entity(log.getEntity())
                .details(log.getDetails())
                .timestamp(log.getTimestamp())
                .build();
    }
}
