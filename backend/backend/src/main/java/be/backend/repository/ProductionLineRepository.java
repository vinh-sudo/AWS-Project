package be.backend.repository;


import be.backend.entity.ProductionLine;
import be.backend.model.dto.LineCapacityDTO;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
@Repository
public interface ProductionLineRepository extends JpaRepository<ProductionLine, Long> {

    @Query(value = """
        SELECT
            pl.line_id::BIGINT               AS lineId,
            pl.line_name                     AS lineName,
            pl.shift_hours::INTEGER          AS shiftHours,
            pl.efficiency::DOUBLE PRECISION  AS efficiency,

            COALESCE(
                SUM(
                    EXTRACT(EPOCH FROM (ps.end_time - ps.start_time)) / 3600
                ), 0
            )::DOUBLE PRECISION AS busyHours,

            COUNT(DISTINCT m.machine_id)::BIGINT AS totalMachines,

            COUNT(DISTINCT
                CASE
                    WHEN ps.status IN ('Scheduled','In Progress')
                    THEN m.machine_id
                END
            )::BIGINT AS busyMachines

        FROM production_line pl

        LEFT JOIN machine m
               ON m.line_id = pl.line_id
              AND m.status = 'active'

        LEFT JOIN production_schedule ps
               ON ps.machine_id = m.machine_id
              AND ps.start_time <= :now
              AND ps.end_time   >= :now
              AND ps.status IN ('Scheduled','In Progress')

        GROUP BY
            pl.line_id,
            pl.line_name,
            pl.shift_hours,
            pl.efficiency
        """, nativeQuery = true)
    List<LineCapacityDTO> getLineCapacity(@Param("now") OffsetDateTime now);
}

