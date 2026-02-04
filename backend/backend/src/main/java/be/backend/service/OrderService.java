package be.backend.service;

import be.backend.entity.*;
import be.backend.exception.BusinessException;
import be.backend.exception.ResourceNotFoundException;
import be.backend.mapper.OrderMapper;
import be.backend.model.request.CreateOrderRequest;
import be.backend.model.request.OrderItemRequest;
import be.backend.model.request.UpdateOrderRequest;
import be.backend.model.response.OrderResponse;
import be.backend.model.response.OrderStopResponse;
import be.backend.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductionScheduleRepository scheduleRepo;
    private final UserRepository userRepository;
    private final MachineRepository machineRepo;
    private final AuditLogRepository auditRepo;
    private final OrderMapper orderMapper;

    private static final String STATUS_DRAFT = "Draft";
    private static final String STATUS_CONFIRMED = "Confirmed";
    private static final String STATUS_IN_PRODUCTION = "In Production";
    private static final String STATUS_COMPLETED = "Completed";
    private static final String STATUS_CANCELLED = "Cancelled";

    private static final Set<String> VALID_PRIORITIES = Set.of("Low", "Medium", "High", "Urgent");
    private static final Set<String> EDITABLE_STATUSES = Set.of(STATUS_DRAFT, STATUS_CONFIRMED);

    // ==================== CRUD ====================

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request, Integer adminUserId) {
        log.info("Admin {} creating order", adminUserId);
        
        // Validations
        validatePriority(request.getPriority());
        validateQuantity(request.getQuantity());
        validateDeadline(request.getDeadline());

        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Order order = orderMapper.toEntity(request);
        order.setCreatedBy(admin);
        order.setStatus(STATUS_DRAFT);
        order.setPriority(request.getPriority() != null ? request.getPriority() : "Medium");
        order.setCreatedAt(OffsetDateTime.now());
        order.setUpdatedAt(OffsetDateTime.now());

        // Add items
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (OrderItemRequest itemReq : request.getItems()) {
                validateItemQuantity(itemReq.getQuantity());
                OrderItem item = orderMapper.toOrderItemEntity(itemReq);
                item.setOrder(order);
                order.getItems().add(item);
            }
        }

        Order saved = orderRepository.save(order);
        log.info("Order {} created with {} items", saved.getId(), saved.getItems().size());
        return buildResponse(saved);
    }

    public OrderResponse getOrderById(Integer orderId) {
        Order order = orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
        return buildResponse(order);
    }

    @Transactional
    public OrderResponse updateOrder(Integer orderId, UpdateOrderRequest request) {
        Order order = getOrderEntity(orderId);
        validateEditable(order);

        // Validate và update fields
        if (request.getCustomerName() != null) {
            order.setCustomerName(request.getCustomerName());
        }
        if (request.getProductType() != null) {
            order.setProductType(request.getProductType());
        }
        if (request.getQuantity() != null) {
            validateQuantity(request.getQuantity());
            order.setQuantity(request.getQuantity());
        }
        if (request.getDeadline() != null) {
            validateDeadline(request.getDeadline());
            order.setDeadline(request.getDeadline());
        }
        if (request.getPriority() != null) {
            validatePriority(request.getPriority());
            order.setPriority(request.getPriority());
        }
        order.setUpdatedAt(OffsetDateTime.now());

        // Update items nếu có
        if (request.getItems() != null) {
            order.getItems().clear();
            for (OrderItemRequest itemReq : request.getItems()) {
                validateItemQuantity(itemReq.getQuantity());
                OrderItem item = orderMapper.toOrderItemEntity(itemReq);
                item.setOrder(order);
                order.getItems().add(item);
            }
        }

        Order saved = orderRepository.save(order);
        log.info("Order {} updated", orderId);
        return buildResponse(saved);
    }

    @Transactional
    public OrderResponse deleteOrder(Integer orderId) {
        Order order = getOrderEntity(orderId);
        
        if (!STATUS_DRAFT.equals(order.getStatus()) && !STATUS_CANCELLED.equals(order.getStatus())) {
            throw new BusinessException("Only Draft or Cancelled orders can be deleted. Current status: " + order.getStatus());
        }
        
        // Lưu response trước khi xóa
        OrderResponse response = buildResponse(order);
        
        // Xóa items trước (đảm bảo cascade hoạt động)
        order.getItems().clear();
        orderRepository.delete(order);
        orderRepository.flush();
        
        log.info("Order {} deleted successfully", orderId);
        return response;
    }

    // ==================== STATUS ACTIONS ====================

    @Transactional
    public OrderResponse confirmOrder(Integer orderId) {
        Order order = getOrderEntity(orderId);
        
        if (!STATUS_DRAFT.equals(order.getStatus())) {
            throw new BusinessException("Only Draft orders can be confirmed. Current status: " + order.getStatus());
        }
        if (order.getItems() == null || order.getItems().isEmpty()) {
            throw new BusinessException("Cannot confirm order without items. Please add items first.");
        }
        
        order.setStatus(STATUS_CONFIRMED);
        order.setUpdatedAt(OffsetDateTime.now());
        
        Order saved = orderRepository.save(order);
        log.info("Order {} confirmed", orderId);
        return buildResponse(saved);
    }

    @Transactional
    public OrderResponse startProduction(Integer orderId) {
        Order order = getOrderEntity(orderId);
        
        if (!STATUS_CONFIRMED.equals(order.getStatus())) {
            throw new BusinessException("Only Confirmed orders can start production. Current status: " + order.getStatus());
        }
        
        order.setStatus(STATUS_IN_PRODUCTION);
        order.setUpdatedAt(OffsetDateTime.now());
        
        Order saved = orderRepository.save(order);
        log.info("Order {} started production", orderId);
        return buildResponse(saved);
    }

    @Transactional
    public OrderResponse completeOrder(Integer orderId) {
        Order order = getOrderEntity(orderId);
        
        if (!STATUS_IN_PRODUCTION.equals(order.getStatus())) {
            throw new BusinessException("Only In Production orders can be completed. Current status: " + order.getStatus());
        }
        
        order.setStatus(STATUS_COMPLETED);
        order.setUpdatedAt(OffsetDateTime.now());
        
        Order saved = orderRepository.save(order);
        log.info("Order {} completed", orderId);
        return buildResponse(saved);
    }

    @Transactional
    public OrderResponse cancelOrder(Integer orderId, String reason) {
        Order order = getOrderEntity(orderId);
        
        if (STATUS_COMPLETED.equals(order.getStatus())) {
            throw new BusinessException("Cannot cancel completed order");
        }
        if (STATUS_CANCELLED.equals(order.getStatus())) {
            throw new BusinessException("Order already cancelled");
        }
        
        order.setStatus(STATUS_CANCELLED);
        order.setUpdatedAt(OffsetDateTime.now());
        // Note: Nếu muốn lưu reason, cần thêm field cancel_reason vào Order entity
        
        Order saved = orderRepository.save(order);
        log.info("Order {} cancelled. Reason: {}", orderId, reason != null ? reason : "No reason provided");
        return buildResponse(saved);
    }
    // ==================== StopOrder ====================
    @Transactional
    public OrderStopResponse stopOrder(Integer orderId, Account account) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (order.getStatus().equals("COMPLETED")) {
            throw new RuntimeException("Cannot stop completed order");
        }

        if (order.getStatus().equals("CANCELLED")) {
            throw new RuntimeException("Order already cancelled");
        }

        order.setStatus("STOPPED");
        orderRepository.save(order);

        List<ProductionSchedule> schedules =
                scheduleRepo.findByOrder(order);

        int stopped = 0;

        for (ProductionSchedule s : schedules) {

            if (s.getStatus().equalsIgnoreCase("SCHEDULED")
                    || s.getStatus().equalsIgnoreCase("RUNNING")) {

                s.setStatus("STOPPED");
                stopped++;

                if (s.getMachine() != null) {
                    Machine m = s.getMachine();
                    m.setStatus("IDLE");
                    machineRepo.save(m);
                }
            }
        }

        scheduleRepo.saveAll(schedules);

        // ===== AUDIT LOG =====
        AuditLog log = new AuditLog();
        log.setUser(account.getUser());
        log.setActionType("STOP_ORDER");
        log.setEntity("Order");
        log.setDetails("Stopped order " + orderId +
                " | stopped schedules = " + stopped);

        auditRepo.save(log);

        return OrderStopResponse.builder()
                .orderId(orderId)
                .status("STOPPED")
                .stoppedSchedules(stopped)
                .build();

    }

    // ==================== QUERIES (Index-based) ====================

    public List<OrderResponse> getAllOrders() {
        List<Order> orders = orderRepository.findAll();
        return buildResponseList(orders);
    }

    // idx_orders_status
    public List<OrderResponse> getOrdersByStatus(String status) {
        validateStatus(status);
        List<Order> orders = orderRepository.findByStatus(status);
        return buildResponseList(orders);
    }

    // idx_orders_priority
    public List<OrderResponse> getOrdersByPriority(String priority) {
        validatePriority(priority);
        List<Order> orders = orderRepository.findByPriority(priority);
        return buildResponseList(orders);
    }

    // idx_orders_created_by
    public List<OrderResponse> getOrdersByCreatedBy(Integer userId) {
        List<Order> orders = orderRepository.findByCreatedById(userId);
        return buildResponseList(orders);
    }

    // idx_orders_status + idx_orders_priority + customerName
    public List<OrderResponse> searchOrders(String status, String priority, String customerName) {
        // Validate nếu có giá trị
        if (status != null) validateStatus(status);
        if (priority != null) validatePriority(priority);
        
        List<Order> orders = orderRepository.searchOrders(status, priority, customerName);
        return buildResponseList(orders);
    }

    // idx_orders_deadline
    public List<OrderResponse> getUpcomingDeadlineOrders(int daysAhead) {
        if (daysAhead < 0) {
            throw new BusinessException("Days ahead must be positive");
        }
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime deadline = now.plusDays(daysAhead);
        List<Order> orders = orderRepository.findUpcomingDeadline(now, deadline);
        return buildResponseList(orders);
    }

    // ==================== STATISTICS ====================

    public long countOrdersByStatus(String status) {
        return orderRepository.findByStatus(status).size();
    }

    // ==================== PRIVATE VALIDATIONS ====================

    private Order getOrderEntity(Integer orderId) {
        return orderRepository.findByIdWithDetails(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));
    }

    private void validatePriority(String priority) {
        if (priority != null && !VALID_PRIORITIES.contains(priority)) {
            throw new BusinessException("Invalid priority: " + priority + ". Valid values: " + VALID_PRIORITIES);
        }
    }

    private void validateStatus(String status) {
        Set<String> validStatuses = Set.of(STATUS_DRAFT, STATUS_CONFIRMED, STATUS_IN_PRODUCTION, STATUS_COMPLETED, STATUS_CANCELLED);
        if (status != null && !validStatuses.contains(status)) {
            throw new BusinessException("Invalid status: " + status + ". Valid values: " + validStatuses);
        }
    }

    private void validateQuantity(Integer quantity) {
        if (quantity != null && quantity <= 0) {
            throw new BusinessException("Quantity must be greater than 0");
        }
    }

    private void validateItemQuantity(Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new BusinessException("Item quantity must be greater than 0");
        }
    }

    private void validateDeadline(OffsetDateTime deadline) {
        if (deadline != null && deadline.isBefore(OffsetDateTime.now())) {
            throw new BusinessException("Deadline must be in the future");
        }
    }

    private void validateEditable(Order order) {
        if (!EDITABLE_STATUSES.contains(order.getStatus())) {
            throw new BusinessException("Cannot edit order with status: " + order.getStatus() + ". Editable statuses: " + EDITABLE_STATUSES);
        }
    }

    // ==================== PRIVATE BUILDERS ====================

    private OrderResponse buildResponse(Order order) {
        OrderResponse response = orderMapper.toResponse(order);
        response.setItems(orderMapper.toOrderItemResponseList(order.getItems()));
        response.setTotalPrice(calculateTotalPrice(order.getItems()));
        return response;
    }

    private List<OrderResponse> buildResponseList(List<Order> orders) {
        if (!orders.isEmpty()) {
            orderRepository.fetchItemsForOrders(orders);
        }
        return orders.stream().map(this::buildResponse).toList();
    }

    private BigDecimal calculateTotalPrice(List<OrderItem> items) {
        if (items == null || items.isEmpty()) return BigDecimal.ZERO;
        return items.stream()
                .filter(i -> i.getPrice() != null && i.getQuantity() != null)
                .map(i -> i.getPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}