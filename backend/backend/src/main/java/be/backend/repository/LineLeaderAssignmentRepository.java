package be.backend.repository;

import be.backend.entity.LineLeaderAssignment;
import org.springframework.data.repository.query.Param; 

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;

@Repository
public interface LineLeaderAssignmentRepository extends JpaRepository<LineLeaderAssignment, Long> {

    @Query("""
                SELECT a
                FROM LineLeaderAssignment a
                WHERE a.line.id = :lineId
                  AND a.startDate <= :start
                  AND (a.endDate IS NULL OR a.endDate >= :end)
            """)
    Optional<LineLeaderAssignment> findActiveLeader(Long lineId,
            OffsetDateTime start,
            OffsetDateTime end);

    /**
     * Tìm line mà leader đang quản lý (status = ACTIVE)
     * JOIN FETCH line → tránh N+1 query
     */
    @Query("""
                SELECT a FROM LineLeaderAssignment a
                JOIN FETCH a.line
                WHERE a.leader.id = :leaderId
                  AND a.status = 'ACTIVE'
            """)
    Optional<LineLeaderAssignment> findActiveByLeaderId(
            @Param("leaderId") Integer leaderId);
}
