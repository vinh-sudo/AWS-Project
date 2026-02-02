package be.backend.repository;

import be.backend.entity.Machine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MachineRepository extends JpaRepository<Machine,Integer> {
        List<Machine> findByLineIdAndStatus(Integer lineId, String status);

    }
