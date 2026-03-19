package be.backend.controller;

import be.backend.model.response.OrderResponse;
import be.backend.service.admin.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller dành riêng cho Manager
 * Nghiệp vụ: Xem orders đã được admin tạo, lên plan, giao việc cho line leader
 * 
 * Nguyên lý:
 * - SRP: Tách biệt nghiệp vụ manager khỏi admin
 * - RESTful: Path rõ ràng /api/manager/orders
 * - Security: @PreAuthorize đảm bảo chỉ manager truy cập
 */
@RestController
@RequestMapping("/api/manager/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
public class ManagerOrderController {

    private final OrderService orderService;

    /**
     * Xem tất cả orders (chỉ manager)
     * Manager cần xem orders để lên plan
     */
    @GetMapping
    public ResponseEntity<List<OrderResponse>> viewAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    /**
     * Xem chi tiết 1 order
     */
    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> viewOrderDetail(@PathVariable Integer id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    /**
     * Tìm kiếm orders theo các tiêu chí
     * Manager dùng để filter orders cần lên plan
     */
    @GetMapping("/search")
    public ResponseEntity<List<OrderResponse>> searchOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String customerName) {
        return ResponseEntity.ok(orderService.searchOrders(status, priority, customerName));
    }

    /**
     * Xem orders theo status
     * Ví dụ: Manager chỉ muốn xem orders CONFIRMED để lên plan
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<OrderResponse>> viewOrdersByStatus(@PathVariable String status) {
        return ResponseEntity.ok(orderService.getOrdersByStatus(status));
    }

    /**
     * Note: Các chức năng planning đã có ở ManagerPlanningController:
     * - POST /api/manager/plans/create-by-item - Tạo plan theo order item (auto route)
     * - POST /api/manager/plans/order/{orderId}/confirm-item/{orderItemId} - Confirm plan theo order item
     * - POST /api/manager/plans/order/{orderId}/cancel - Cancel draft plan
     * - GET /api/manager/plans/view - Xem plans
     */
}