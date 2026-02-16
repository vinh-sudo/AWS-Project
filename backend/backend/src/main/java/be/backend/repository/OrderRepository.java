package be.backend.repository;

import be.backend.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {


    // ==================== SINGLE ORDER ====================
    
    @Query("SELECT DISTINCT o FROM Order o " +
           "LEFT JOIN FETCH o.createdBy " +
           "LEFT JOIN FETCH o.items " +
           "WHERE o.id = :id")
    Optional<Order> findByIdWithDetails(@Param("id") Integer id);

    // ==================== INDEX-BASED QUERIES ====================

    // idx_orders_status
    List<Order> findByStatus(String status);

    // idx_orders_priority
    List<Order> findByPriority(String priority);

    // idx_orders_created_by
    List<Order> findByCreatedById(Integer createdBy);

    // idx_orders_status + idx_orders_priority
    List<Order> findByStatusAndPriority(String status, String priority);

    // idx_orders_deadline
    @Query("SELECT o FROM Order o WHERE " +
           "o.status NOT IN ('Completed', 'Cancelled') AND " +
           "o.deadline BETWEEN :from AND :to " +
           "ORDER BY o.deadline ASC")
    List<Order> findUpcomingDeadline(@Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to);

    // ==================== SEARCH (Index columns FIRST, LIKE last) ====================

    @Query("SELECT o FROM Order o WHERE " +
           "(:status IS NULL OR o.status = :status) AND " +
           "(:priority IS NULL OR o.priority = :priority) AND " +
           "(:customerName IS NULL OR LOWER(o.customerName) LIKE LOWER(CONCAT('%', :customerName, '%')))")
    List<Order> searchOrders(
            @Param("status") String status,
            @Param("priority") String priority,
            @Param("customerName") String customerName
    );

    // ==================== BATCH FETCH (tránh N+1) ====================

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.items WHERE o IN :orders")
    List<Order> fetchItemsForOrders(@Param("orders") List<Order> orders);

    // ==================== STATISTICS ====================

    @Query("SELECT o.status, COUNT(o) FROM Order o GROUP BY o.status")
    List<Object[]> countGroupByStatus();

    // Count by specific status (sử dụng index idx_orders_status)
    long countByStatus(String status);
}