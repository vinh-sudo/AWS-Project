package be.backend.repository;

import be.backend.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Integer> {
    // idx_order_items_order_id
    List<OrderItem> findByOrderId(Integer orderId);
}