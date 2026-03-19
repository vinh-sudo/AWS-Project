package be.backend.repository;

import be.backend.entity.Machine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MachineRepository extends JpaRepository<Machine,Integer> {
        List<Machine> findByLineIdAndStatus(Integer lineId, String status);
        long countByStatus(String status);

    @Query("SELECT m FROM Machine m WHERE m.line.id = :lineId AND UPPER(COALESCE(m.status, 'ACTIVE')) = 'ACTIVE'")
    List<Machine> findActiveByLineId(@Param("lineId") Integer lineId);
    }
