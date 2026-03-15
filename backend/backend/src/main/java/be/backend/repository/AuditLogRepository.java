package be.backend.repository;

import be.backend.entity.AuditLog;
import be.backend.enums.ActionType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * AuditLog Repository với optimized query methods
 * 
 * Nguyên lý:
 * - Method names match indexes → Fast queries
 * - Pageable để không load hết vào memory
 * - Specific queries cho từng use case
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Integer> {

    @Override
    @EntityGraph(attributePaths = "user")
    Page<AuditLog> findAll(Pageable pageable);
    
    /**
     * Query 1: Xem logs của 1 user trong khoảng thời gian
     * Use case: Admin xem "User X đã làm gì từ ngày A đến B"
     * Index: idx_audit_user_time (user_id, timestamp)
     */
    @EntityGraph(attributePaths = "user")
    Page<AuditLog> findByUserIdAndTimestampBetween(
        Integer userId,
        OffsetDateTime start,
        OffsetDateTime end,
        Pageable pageable
    );
    
    /**
     * Query 2: Xem logs của 1 entity cụ thể
     * Use case: "Xem lịch sử của Order #123"
     * Index: idx_audit_entity (entity, entity_id, timestamp)
     */
    @EntityGraph(attributePaths = "user")
    Page<AuditLog> findByEntityAndEntityIdOrderByTimestampDesc(
        String entity,
        Integer entityId,
        Pageable pageable
    );
    
    /**
     * Query 3: Xem logs theo action type
     * Use case: "Xem tất cả DELETE actions trong 30 ngày"
     * Index: idx_audit_action (action_type, timestamp)
     */
    @EntityGraph(attributePaths = "user")
    Page<AuditLog> findByActionTypeAndTimestampAfter(
        ActionType actionType,
        OffsetDateTime after,
        Pageable pageable
    );
    
    /**
     * Query 4: Xem CRITICAL actions gần đây
     * Use case: Security monitoring dashboard
     */
    @Query("""
        SELECT a FROM AuditLog a 
        WHERE a.actionType IN :criticalActions 
        AND a.timestamp >= :since 
        ORDER BY a.timestamp DESC
        """)
    @EntityGraph(attributePaths = "user")
    Page<AuditLog> findCriticalActions(
        @Param("criticalActions") List<ActionType> criticalActions,
        @Param("since") OffsetDateTime since,
        Pageable pageable
    );
    
    /**
     * Query 5: Count logs cần archive
     * Use case: Archival job - "Có bao nhiêu logs cũ hơn 3 tháng?"
     * Index: idx_audit_timestamp
     */
    long countByTimestampBefore(OffsetDateTime before);
    
    /**
     * Query 6: Find logs cần archive
     * Use case: Archival job - Move to audit_log_archive
     * Index: idx_audit_timestamp
     */
    List<AuditLog> findByTimestampBeforeOrderByTimestampAsc(
        OffsetDateTime before,
        Pageable pageable
    );
    
    /**
     * Query 7: Delete logs đã được archive
     * Use case: Cleanup sau khi copy sang audit_log_archive
     */
    void deleteByTimestampBefore(OffsetDateTime before);
}