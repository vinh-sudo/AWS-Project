package be.backend.controller.manager;

import be.backend.entity.Account;
import be.backend.model.request.CreatePlanByItemRequest;
import be.backend.model.response.OrderPlanItemsViewResponse;
import be.backend.model.response.ProductionPlanResponse;
import be.backend.model.response.ScheduleValidationResult;
import be.backend.service.manager.ManagerPlanningService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manager/plans")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
public class ManagerPlanningController {

    private final ManagerPlanningService planningService;

    @PostMapping("/create-by-item")
    public ResponseEntity<List<ProductionPlanResponse>> createPlanByItem(
            @Valid @RequestBody CreatePlanByItemRequest request,
            @AuthenticationPrincipal Account account
    ) {
        return ResponseEntity.ok(planningService.createPlanByItem(request, account));
    }

    @PostMapping("/order/{orderId}/confirm-item/{orderItemId}")
    public ResponseEntity<?> confirmOrderItem(
            @PathVariable Integer orderId,
            @PathVariable Integer orderItemId,
            @AuthenticationPrincipal Account account
    ) {
        ScheduleValidationResult result = planningService.confirmOrderItem(orderId, orderItemId, account);
        if (!result.isOk()) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/order/{orderId}/cancel")
    public ResponseEntity<String> cancel(
            @PathVariable Integer orderId,
            @AuthenticationPrincipal Account account
    ) {
        planningService.cancel(orderId, account);
        return ResponseEntity.ok("Order " + orderId + " plan cancelled");
    }

    @GetMapping("/view")
    public List<ProductionPlanResponse> getAll(
            @RequestParam(required = false) String status
    ) {
        return planningService.getAllPlans(status);
    }

    @GetMapping("/order/{orderId}/items")
    public ResponseEntity<OrderPlanItemsViewResponse> getOrderItemPlans(
            @PathVariable Integer orderId
    ) {
        return ResponseEntity.ok(planningService.getOrderItemPlansView(orderId));
    }
}
