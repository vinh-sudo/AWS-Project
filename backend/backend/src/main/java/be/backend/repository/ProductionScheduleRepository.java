package be.backend.repository;

import be.backend.entity.ProductionSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;

@Repository
public interface ProductionScheduleRepository
        extends JpaRepository<ProductionSchedule, Long> {

    @Query("""
        SELECT COUNT(ps)
        FROM ProductionSchedule ps
        WHERE ps.line.id = :lineId
          AND ps.status IN ('Scheduled', 'In Progress')
          AND (
                ps.startTime < :endTime
            AND ps.endTime   > :startTime
          )
    """)
    long countConflictSchedule(
            @Param("lineId") Long lineId,
            @Param("startTime") OffsetDateTime startTime,
            @Param("endTime") OffsetDateTime endTime
    );
}

