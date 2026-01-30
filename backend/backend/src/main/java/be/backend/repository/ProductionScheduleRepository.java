package be.backend.repository;

import be.backend.entity.ProductionSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.OffsetDateTime;
public interface ProductionScheduleRepository extends JpaRepository<ProductionSchedule, Integer> {

    @Query("""
    SELECT COUNT(s) > 0
    FROM ProductionSchedule s
    WHERE s.machine.id = :machineId
    AND (s.startTime < :endTime AND s.endTime > :startTime)
""")
    boolean existsOverlappingMachine(Long machineId,
                                     OffsetDateTime startTime,
                                     OffsetDateTime endTime);
}

