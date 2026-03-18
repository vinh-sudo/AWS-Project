package be.backend.repository;

import be.backend.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

import be.backend.model.dto.projection.ProductionSummaryProjection;
import be.backend.model.dto.projection.OeeTrendProjection;
import be.backend.model.dto.projection.LineComparisonProjection;
import org.springframework.data.repository.query.Param;

public interface ReportRepository extends JpaRepository<Report, Integer> {

    @Query("""
                select r
                from Report r
                where r.line.id in :lineIds
                and r.workDate = :date
            """)
    List<Report> findAllByLineIdsAndDate(
            List<Integer> lineIds,
            LocalDate date);

    @Query(value = """
            SELECT COALESCE(SUM(r.good_quantity), 0) AS totalGood,
                   COALESCE(SUM(r.reject_quantity), 0) AS totalReject,
                   COALESCE(SUM(r.target_quantity), 0) AS totalTarget,
                   COALESCE(SUM(r.downtime_minutes), 0) AS totalDowntime
            FROM report r
            WHERE r.work_date BETWEEN :from AND :to
            """, nativeQuery = true)
    ProductionSummaryProjection getProductionSummary(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Query(value = """
            SELECT r.work_date AS workDate,
                   SUM(r.good_quantity) AS totalGood,
                   SUM(r.reject_quantity) AS totalReject,
                   SUM(r.target_quantity) AS totalTarget,
                   COALESCE(SUM(r.downtime_minutes), 0) AS totalDowntime,
                   MAX(pl.shift_hours) AS shiftHours
            FROM report r
            JOIN production_line pl ON pl.line_id = r.line_id
            WHERE r.work_date BETWEEN :from AND :to
            GROUP BY r.work_date
            ORDER BY r.work_date
            """, nativeQuery = true)
    List<OeeTrendProjection> getOeeTrend(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Query(value = """
            SELECT r.line_id AS lineId,
                   pl.line_name AS lineName,
                   COALESCE(SUM(r.good_quantity), 0) AS totalGood,
                   COALESCE(SUM(r.reject_quantity), 0) AS totalReject,
                   COALESCE(SUM(r.target_quantity), 0) AS totalTarget,
                   COALESCE(SUM(r.downtime_minutes), 0) AS totalDowntime,
                   MAX(pl.shift_hours) AS shiftHours
            FROM report r
            JOIN production_line pl ON pl.line_id = r.line_id
            WHERE r.work_date BETWEEN :from AND :to
            GROUP BY r.line_id, pl.line_name
            ORDER BY pl.line_name
            """, nativeQuery = true)
    List<LineComparisonProjection> getLineComparison(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    /**
     * Check trùng report (leader + line + ngày + ca)
     * Tránh submit trùng
     */
    boolean existsByEmployeeIdAndLineIdAndWorkDateAndShift(
            Integer employeeId, Integer lineId,
            LocalDate workDate, String shift);

    /**
     * Check trùng report (leader + line + order + ngày + ca)
     * Tránh submit trùng
     */
    boolean existsByEmployeeIdAndLineIdAndScheduleIdAndWorkDateAndShift(
            Integer employeeId, Integer lineId, Integer scheduleId,
            LocalDate workDate, String shift);

    @Query("""
            select coalesce(sum(r.goodQuantity), 0)
            from Report r
            where r.schedule.id = :scheduleId
            """)
    Long sumGoodQuantityByScheduleId(@Param("scheduleId") Integer scheduleId);

    /**
     * Tổng sản lượng hôm nay của 1 line
     * Dùng cho dashboard
     */
    @Query(value = """
                SELECT COALESCE(SUM(r.good_quantity), 0) AS totalGood,
                       COALESCE(SUM(r.reject_quantity), 0) AS totalReject,
                       COALESCE(SUM(r.downtime_minutes), 0) AS totalDowntime,
                       COALESCE(SUM(r.target_quantity), 0) AS totalTarget
                FROM report r
                WHERE r.line_id = :lineId AND r.work_date = :date
            """, nativeQuery = true)
    ProductionSummaryProjection getTodaySummaryByLineId(
            @Param("lineId") Integer lineId,
            @Param("date") LocalDate date);
}
