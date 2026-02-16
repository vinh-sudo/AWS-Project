package be.backend.repository;

import be.backend.entity.ProductionFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductionFileRepository extends JpaRepository<ProductionFile, Integer> {


    boolean existsByOrderId(Integer orderId);

    List<ProductionFile> findByOrderId(Integer orderId);
    void deleteByOrderId(Integer orderId);
}
