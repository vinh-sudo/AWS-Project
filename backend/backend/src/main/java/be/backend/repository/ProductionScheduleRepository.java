package be.backend.repository;

import be.backend.entity.ProductionSchedule;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import be.backend.model.dto.projection.ScheduleAdherenceProjection;
import org.springframework.data.repository.query.Param;

public interface ProductionScheduleRepository extends JpaRepository<ProductionSchedule, Integer> {

        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("""
                            SELECT COUNT(s) > 0
                            FROM ProductionSchedule s
                            WHERE s.machine.id = :machineId
                              AND s.status IN ('SCHEDULED','RUNNING')
                              AND (s.startTime < :endTime AND s.endTime > :startTime)
                        """)
        boolean existsOverlappingMachineForUpdate(
                        Long machineId,
                        OffsetDateTime startTime,
                        OffsetDateTime endTime);

        @Query("""
                            select s
                            from ProductionSchedule s
                            join fetch s.plan p
                            join fetch p.line
                            join fetch s.machine
                            join fetch s.order
                            where s.startTime <= :end
                              and s.endTime >= :start
                        """)
        List<ProductionSchedule> findInRange(
                        OffsetDateTime start,
                        OffsetDateTime end);

        @Query("""
                            select s
                            from ProductionSchedule s
                            join fetch s.plan p
                            join fetch p.line
                            join fetch s.machine
                            where s.status = 'RUNNING'
                        """)
        List<ProductionSchedule> findRunning();

        Optional<ProductionSchedule> findByIdAndStatus(Integer id, String status);

        List<ProductionSchedule> findByOrderIdAndStatus(Integer orderId, String status);

        @Query(value = """
                        SELECT COUNT(*) AS totalSchedules,
                               COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS completedCount,
                               COUNT(CASE WHEN status = 'RUNNING' THEN 1 END) AS runningCount,
                               COUNT(CASE WHEN status = 'PAUSED' THEN 1 END) AS pausedCount
                        FROM production_schedule
                        WHERE start_time >= :from AND start_time < :to
                        """, nativeQuery = true)
        ScheduleAdherenceProjection getAdherenceStats(
                        @Param("from") OffsetDateTime from,
                        @Param("to") OffsetDateTime to);

        /**
         * Lấy tất cả schedule đang active thuộc 1 line
         * Dùng cho dashboard + xem danh sách schedule
         */
        @Query("""
                            SELECT s FROM ProductionSchedule s
                            JOIN FETCH s.order o
                            JOIN FETCH o.items
                            JOIN FETCH s.machine
                            JOIN FETCH s.plan p
                            JOIN FETCH p.line
                            WHERE p.line.id = :lineId
                              AND s.status IN ('SCHEDULED', 'RUNNING', 'PAUSED')
                            ORDER BY s.startTime ASC
                        """)
        List<ProductionSchedule> findActiveByLineId(
                        @Param("lineId") Integer lineId);

        List<ProductionSchedule> findByOrderId(Integer orderId);

        long countByOrderIdAndStatusNot(Integer orderId, String status);
}
