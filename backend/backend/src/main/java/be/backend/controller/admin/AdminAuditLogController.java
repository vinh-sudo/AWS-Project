package be.backend.controller.admin;

import be.backend.entity.AuditLog;
import be.backend.enums.ActionType;
import be.backend.model.response.AuditLogResponse;
import be.backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuditLogController {

    private final AuditLogRepository auditLogRepository;
    private static final int MAX_PAGE_SIZE = 200;
    private static final Pattern ENTITY_PATTERN = Pattern.compile("^[A-Z_]{2,50}$");

    @GetMapping
    public ResponseEntity<Page<AuditLogResponse>> getAllAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = safePageable(page, size, true);
        return ResponseEntity.ok(auditLogRepository.findAll(pageable).map(this::toResponse));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<AuditLogResponse>> getLogsByUser(
            @PathVariable Integer userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        OffsetDateTime start = startDate != null ? startDate : OffsetDateTime.now().minusDays(30);
        OffsetDateTime end = endDate != null ? endDate : OffsetDateTime.now();
        validateTimeRange(start, end);
        Pageable pageable = safePageable(page, size, true);

        return ResponseEntity.ok(auditLogRepository
                .findByUserIdAndTimestampBetween(userId, start, end, pageable)
                .map(this::toResponse));
    }

    @GetMapping("/entity/{entity}/{entityId}")
    public ResponseEntity<Page<AuditLogResponse>> getLogsByEntity(
            @PathVariable String entity,
            @PathVariable Integer entityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        String normalizedEntity = normalizeEntity(entity);
        Pageable pageable = safePageable(page, size, false);
        return ResponseEntity.ok(auditLogRepository
                .findByEntityAndEntityIdOrderByTimestampDesc(normalizedEntity, entityId, pageable)
                .map(this::toResponse));
    }

    @GetMapping("/action/{actionType}")
    public ResponseEntity<Page<AuditLogResponse>> getLogsByAction(
            @PathVariable String actionType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime since,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        ActionType action;
        try {
            action = ActionType.valueOf(actionType.toUpperCase());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }

        OffsetDateTime sinceDate = since != null ? since : OffsetDateTime.now().minusDays(30);
        Pageable pageable = safePageable(page, size, true);

        return ResponseEntity.ok(auditLogRepository
            .findByActionTypeAndTimestampAfter(action, sinceDate, pageable)
            .map(this::toResponse));
    }

    @GetMapping("/critical")
        public ResponseEntity<Page<AuditLogResponse>> getCriticalLogs(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime since,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        List<ActionType> criticalActions = Arrays.stream(ActionType.values())
                .filter(ActionType::isCritical)
                .toList();

        OffsetDateTime sinceDate = since != null ? since : OffsetDateTime.now().minusDays(7);
        Pageable pageable = safePageable(page, size, false);

        return ResponseEntity.ok(auditLogRepository
                .findCriticalActions(criticalActions, sinceDate, pageable)
                .map(this::toResponse));
    }

    private Pageable safePageable(int page, int size, boolean sortByTimestampDesc) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(1, Math.min(size, MAX_PAGE_SIZE));
        if (!sortByTimestampDesc) {
            return PageRequest.of(safePage, safeSize);
        }
        return PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "timestamp"));
    }

    private void validateTimeRange(OffsetDateTime start, OffsetDateTime end) {
        if (start.isAfter(end)) {
            throw new IllegalArgumentException("startDate must be before or equal to endDate");
        }
    }

    private String normalizeEntity(String entity) {
        String normalized = entity == null ? "" : entity.trim().toUpperCase();
        if (!ENTITY_PATTERN.matcher(normalized).matches()) {
            throw new IllegalArgumentException("Invalid entity format");
        }
        return normalized;
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .userId(log.getUser() != null ? log.getUser().getId() : null)
                .actionType(log.getActionType())
                .entity(log.getEntity())
                .entityId(log.getEntityId())
                .details(log.getDetails())
                .timestamp(log.getTimestamp())
                .ipAddress(log.getIpAddress())
                .build();
    }
}
