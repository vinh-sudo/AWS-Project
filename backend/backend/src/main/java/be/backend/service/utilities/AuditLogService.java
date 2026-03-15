package be.backend.service.utilities;

import be.backend.entity.AuditLog;
import be.backend.entity.User;
import be.backend.enums.ActionType;
import be.backend.repository.AuditLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.HashMap;
import java.util.Map;

/**
 * AuditLogService - Central service cho audit logging
 * 
 * Nguyên lý:
 * - SRP: Chỉ lo audit logging
 * - Minimal Storage: Chỉ log changes
 * - Builder Pattern: Fluent API
 * - Fail-safe: Audit failure không crash main transaction
 * - Async Option: Không block main thread
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {
    
    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;
    
    /**
     * Log audit (synchronous)
     * Use case: Critical actions cần đảm bảo log trước khi commit
     */
    @Transactional
    public void log(User user, ActionType action, String entity, Integer entityId, 
                    Map<String, Object> changes) {
        try {
            String details = buildCompactDetails(changes);
            String ipAddress = captureIpAddress();
            
            AuditLog log = AuditLog.builder()
                .user(user)
                .actionType(action)
                .entity(entity.toUpperCase())  // Convention: uppercase
                .entityId(entityId)
                .details(details)
                .ipAddress(ipAddress)
                .build();
            
            auditLogRepository.save(log);
            
        } catch (Exception e) {
            // Fail-safe: Audit failure không crash main transaction
            log.error("Failed to save audit log: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Log audit (asynchronous)
     * Use case: Non-critical actions, không muốn block main thread
     */
    @Async
    @Transactional
    public void logAsync(User user, ActionType action, String entity, Integer entityId,
                         Map<String, Object> changes) {
        log(user, action, entity, entityId, changes);
    }
    
    /**
     * Helper: Log simple action (không có changes)
     * Use case: LOGIN, LOGOUT, START_SCHEDULE
     */
    public void logSimple(User user, ActionType action, String entity, Integer entityId) {
        log(user, action, entity, entityId, null);
    }
    
    /**
     * Helper: Build compact details JSON
     * Nguyên lý: Chỉ lưu changes, không full object
     * 
     * Input: {"status": ["PENDING", "CONFIRMED"], "priority": ["LOW", "HIGH"]}
     * Output: {"changed":{"status":["PENDING","CONFIRMED"],"priority":["LOW","HIGH"]}}
     * 
     * Max 2048 chars → Truncate nếu vượt
     */
    private String buildCompactDetails(Map<String, Object> changes) {
        if (changes == null || changes.isEmpty()) {
            return null;
        }
        
        try {
            Map<String, Object> compact = new HashMap<>();
            compact.put("changed", changes);
            
            String json = objectMapper.writeValueAsString(compact);
            
            // Truncate if too long
            if (json.length() > 2048) {
                json = json.substring(0, 2045) + "...";
                log.warn("Audit details truncated (too long)");
            }
            
            return json;
            
        } catch (Exception e) {
            log.error("Failed to serialize audit details", e);
            return "{\"error\":\"serialization_failed\"}";
        }
    }

    private String captureIpAddress() {
        try {
            ServletRequestAttributes attributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) {
                return null;
            }

            HttpServletRequest request = attributes.getRequest();

            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isBlank()) {
                return xForwardedFor.split(",")[0].trim();
            }

            String xRealIp = request.getHeader("X-Real-IP");
            if (xRealIp != null && !xRealIp.isBlank()) {
                return xRealIp;
            }

            return request.getRemoteAddr();
        } catch (Exception e) {
            log.warn("Failed to capture client IP: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Builder cho fluent API
     * Use case: Dễ đọc trong service code
     * 
     * Example:
     * auditLogService.builder()
     *     .user(account.getUser())
     *     .action(ActionType.UPDATE_ORDER)
     *     .entity("ORDER")
     *     .entityId(orderId)
     *     .change("status", oldStatus, newStatus)
     *     .change("priority", oldPriority, newPriority)
     *     .log();
     */
    public AuditBuilder builder() {
        return new AuditBuilder(this);
    }
    
    @RequiredArgsConstructor
    public static class AuditBuilder {
        private final AuditLogService service;
        private User user;
        private ActionType action;
        private String entity;
        private Integer entityId;
        private final Map<String, Object> changes = new HashMap<>();
        
        public AuditBuilder user(User user) {
            this.user = user;
            return this;
        }
        
        public AuditBuilder action(ActionType action) {
            this.action = action;
            return this;
        }
        
        public AuditBuilder entity(String entity) {
            this.entity = entity;
            return this;
        }
        
        public AuditBuilder entityId(Integer entityId) {
            this.entityId = entityId;
            return this;
        }
        
        /**
         * Add một field thay đổi
         * @param field Tên field
         * @param oldValue Giá trị cũ
         * @param newValue Giá trị mới
         */
        public AuditBuilder change(String field, Object oldValue, Object newValue) {
            changes.put(field, new Object[]{oldValue, newValue});
            return this;
        }
        
        /**
         * Execute log
         */
        public void log() {
            service.log(user, action, entity, entityId, changes);
        }
        
        /**
         * Execute log async
         */
        public void logAsync() {
            service.logAsync(user, action, entity, entityId, changes);
        }
    }
}