package be.backend.repository;

import be.backend.entity.IncidentLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.OffsetDateTime;

public interface IncidentLogRepository extends JpaRepository<IncidentLog, Integer> {

    @Query("""
        SELECT COUNT(i) > 0
        FROM IncidentLog i
        WHERE i.line.id = :lineId
          AND (:machineId IS NULL OR i.machine.id = :machineId)
          AND i.severity = 'HIGH'
          AND i.timestamp BETWEEN :start AND :end
    """)
    boolean hasBlockingIncident(Long lineId,
                                Long machineId,
                                OffsetDateTime start,
                                OffsetDateTime end);
}
