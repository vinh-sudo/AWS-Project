package be.backend.controller.manager;

import be.backend.model.response.OrderResponse;
import be.backend.service.admin.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller dedicated to managers
 * Business: view orders created by admins, plan them, and assign work to line leaders
 * 
 * Principles:
 * - SRP: separate manager responsibilities from admin responsibilities
 * - RESTful: clear path /api/manager/orders
 * - Security: @PreAuthorize ensures manager-only access
 */
@RestController
@RequestMapping("/api/manager/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
public class ManagerOrderController {

    private final OrderService orderService;

    /**
    * View all orders (manager only)
    * Managers need to review orders before planning
     */
    @GetMapping
    public ResponseEntity<List<OrderResponse>> viewAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    /**
    * View order details
     */
    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> viewOrderDetail(@PathVariable Integer id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    /**
    * Search orders by criteria
    * Managers use this to filter orders that need planning
     */
    @GetMapping("/search")
    public ResponseEntity<List<OrderResponse>> searchOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String customerName) {
        return ResponseEntity.ok(orderService.searchOrders(status, priority, customerName));
    }

    /**
    * View orders by status
    * Example: a manager only wants to see CONFIRMED orders for planning
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<OrderResponse>> viewOrdersByStatus(@PathVariable String status) {
        return ResponseEntity.ok(orderService.getOrdersByStatus(status));
    }

    /**
    * Note: planning functions already exist in ManagerPlanningController:
    * - POST /api/manager/plans/create-by-item - Create a plan from an order item (auto route)
    * - POST /api/manager/plans/order/{orderId}/confirm-item/{orderItemId} - Confirm a plan for an order item
    * - POST /api/manager/plans/order/{orderId}/cancel - Cancel a draft plan
    * - GET /api/manager/plans/view - View plans
     */
}