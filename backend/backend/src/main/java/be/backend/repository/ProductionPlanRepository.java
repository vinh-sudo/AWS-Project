package be.backend.repository;

import be.backend.entity.ProductionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;


public interface ProductionPlanRepository extends JpaRepository<ProductionPlan, Integer> {
    List<ProductionPlan> findByOrderIdAndDecision(Integer orderId, String decision);

    boolean existsByOrderIdAndDecision(Integer orderId, String decision);

    void deleteByOrderIdAndDecision(Integer orderId, String decision);
    @Query("""
        select p from ProductionPlan p
        join fetch p.order
        left join fetch p.orderItem
        join fetch p.line
        join fetch p.createdBy
        where (:status is null or p.decision = :status)
        order by p.createdAt desc
    """)
    List<ProductionPlan> findAllForManager(@Param("status") String status);

}
