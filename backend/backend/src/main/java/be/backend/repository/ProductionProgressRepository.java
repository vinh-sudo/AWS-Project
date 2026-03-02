package be.backend.repository;

import be.backend.entity.ProductionProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductionProgressRepository 
        extends JpaRepository<ProductionProgress, Integer> {

    /**
     * Lấy progress mới nhất của 1 schedule
     * ORDER BY id DESC → record cuối cùng = mới nhất
     */
    @Query("""
        SELECT p FROM ProductionProgress p
        WHERE p.schedule.id = :scheduleId
        ORDER BY p.id DESC
        LIMIT 1
    """)
    Optional<ProductionProgress> findLatestByScheduleId(
            @Param("scheduleId") Integer scheduleId);
}