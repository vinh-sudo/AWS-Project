package be.backend.controller.manager;

import be.backend.entity.Account;
import be.backend.model.request.ProductionPlanRequest;
import be.backend.model.response.OrderResponse;
import be.backend.model.response.ProductionPlanResponse;
import be.backend.model.response.ScheduleValidationResult;
import be.backend.service.manager.ManagerPlanningService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
public class ManagerPlanningController {

    private final ManagerPlanningService planningService;

    // ===================== ORDERS (for planning) =====================
    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponse>> getOrdersForPlanning(
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(planningService.getOrdersForPlanning(status));
    }

    // ===================== PLANS =====================
    @PostMapping("/plans/create")
    public ResponseEntity<List<ProductionPlanResponse>> createPlan(
            @RequestBody ProductionPlanRequest request,
            @AuthenticationPrincipal Account account
    ) {
        return ResponseEntity.ok(
                planningService.createPlan(request, account)
        );
    }

    @PostMapping("/plans/order/{orderId}/confirm")
    public ResponseEntity<?> confirm(
            @PathVariable Integer orderId,
            @AuthenticationPrincipal Account account
    ) {
        ScheduleValidationResult result =
                planningService.confirm(orderId, account);

        if (!result.isOk()) {
            return ResponseEntity.badRequest().body(result);
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/plans/order/{orderId}/cancel")
    public ResponseEntity<String> cancel(
            @PathVariable Integer orderId,
            @AuthenticationPrincipal Account account
    ) {
        planningService.cancel(orderId, account);
        return ResponseEntity.ok("Order " + orderId + " plan cancelled");
    }

    @GetMapping("/plans/view")
    public List<ProductionPlanResponse> getAll(
            @RequestParam(required = false) String status
    ) {
        return planningService.getAllPlans(status);
    }
}
