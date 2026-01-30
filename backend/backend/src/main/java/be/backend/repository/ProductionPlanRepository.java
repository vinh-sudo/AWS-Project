package be.backend.repository;

import be.backend.entity.ProductionPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;


public interface ProductionPlanRepository extends JpaRepository<ProductionPlan, Integer> {
    List<ProductionPlan> findByOrderIdAndDecision(Integer orderId, String decision);

    void deleteByOrderIdAndDecision(Integer orderId, String decision);

}
