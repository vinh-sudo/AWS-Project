package be.backend.repository;

import be.backend.entity.ProductionSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.OffsetDateTime;
import java.util.List;

public interface ProductionScheduleRepository extends JpaRepository<ProductionSchedule, Integer> {

    @Query("""
        SELECT COUNT(s) > 0
        FROM ProductionSchedule s
        WHERE s.machine.id = :machineId
          AND s.status IN ('SCHEDULED','RUNNING')
          AND (s.startTime < :endTime AND s.endTime > :startTime)
    """)
    boolean existsOverlappingMachine(Long machineId,
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
            OffsetDateTime end
    );
    @Query("""
    select s
    from ProductionSchedule s
    join fetch s.plan p
    join fetch p.line
    join fetch s.machine
    where s.status = 'RUNNING'
""")
    List<ProductionSchedule> findRunning();

}
