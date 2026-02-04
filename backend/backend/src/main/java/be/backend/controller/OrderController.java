package be.backend.controller;

import be.backend.entity.Account;
import be.backend.model.request.CreateOrderRequest;
import be.backend.model.request.UpdateOrderRequest;
import be.backend.model.response.OrderResponse;
import be.backend.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class OrderController {

    private final OrderService orderService;

    // ==================== CRUD ====================

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            @AuthenticationPrincipal Account account) {
        Integer userId = account.getUser() != null ? account.getUser().getId() 
                : (account.getEmployee() != null && account.getEmployee().getUser() != null 
                    ? account.getEmployee().getUser().getId() : null);
        OrderResponse response = orderService.createOrder(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable Integer id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrderResponse> updateOrder(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateOrderRequest request) {
        return ResponseEntity.ok(orderService.updateOrder(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<OrderResponse> deleteOrder(@PathVariable Integer id) {
        return ResponseEntity.ok(orderService.deleteOrder(id));
    }

    // ==================== STATUS ACTIONS ====================

    @PostMapping("/{id}/confirm")
    public ResponseEntity<OrderResponse> confirmOrder(@PathVariable Integer id) {
        return ResponseEntity.ok(orderService.confirmOrder(id));
    }

    @PostMapping("/{id}/start-production")
    public ResponseEntity<OrderResponse> startProduction(@PathVariable Integer id) {
        return ResponseEntity.ok(orderService.startProduction(id));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<OrderResponse> completeOrder(@PathVariable Integer id) {
        return ResponseEntity.ok(orderService.completeOrder(id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(
            @PathVariable Integer id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(orderService.cancelOrder(id, reason));
    }

    // ==================== QUERIES ====================

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<OrderResponse>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(orderService.getOrdersByStatus(status));
    }

    @GetMapping("/priority/{priority}")
    public ResponseEntity<List<OrderResponse>> getByPriority(@PathVariable String priority) {
        return ResponseEntity.ok(orderService.getOrdersByPriority(priority));
    }

    @GetMapping("/my-orders")
    public ResponseEntity<List<OrderResponse>> getMyOrders(@AuthenticationPrincipal Account account) {
        Integer userId = account.getUser() != null ? account.getUser().getId() 
                : (account.getEmployee() != null && account.getEmployee().getUser() != null 
                    ? account.getEmployee().getUser().getId() : null);
        return ResponseEntity.ok(orderService.getOrdersByCreatedBy(userId));
    }

    @GetMapping("/search")
    public ResponseEntity<List<OrderResponse>> searchOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String customerName) {
        return ResponseEntity.ok(orderService.searchOrders(status, priority, customerName));
    }

    @GetMapping("/upcoming-deadline")
    public ResponseEntity<List<OrderResponse>> getUpcomingDeadline(
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(orderService.getUpcomingDeadlineOrders(days));
    }
}