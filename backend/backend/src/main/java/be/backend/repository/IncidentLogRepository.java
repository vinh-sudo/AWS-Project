package be.backend.repository;

import be.backend.entity.IncidentLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.OffsetDateTime;

import be.backend.model.dto.projection.IncidentStatsProjection;
import org.springframework.data.repository.query.Param;
import java.util.List;

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

    @Query(value = """
    SELECT incident_type AS incidentType,
           severity AS severity,
           COUNT(*) AS count
    FROM incident_log
    WHERE timestamp BETWEEN :from AND :to
    GROUP BY incident_type, severity
    ORDER BY count DESC
    """, nativeQuery = true)
    List<IncidentStatsProjection> getIncidentSummary(
        @Param("from") OffsetDateTime from,
        @Param("to") OffsetDateTime to);
}
