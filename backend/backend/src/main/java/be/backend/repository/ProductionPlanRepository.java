package be.backend.repository;

import be.backend.entity.ProductionPlan;
import org.springframework.data.jpa.repository.JpaRepository;


public interface ProductionPlanRepository extends JpaRepository<ProductionPlan, Integer> {


}
