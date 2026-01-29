package be.backend.controller.manager;

import be.backend.entity.Account;
import be.backend.model.request.ProductionPlanRequest;
import be.backend.model.response.ProductionPlanResponse;
import be.backend.service.manager.ManagerPlanningService;
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

    @PostMapping("/create")
    public ResponseEntity<List<ProductionPlanResponse>> createPlan(
            @RequestBody ProductionPlanRequest request,
            @AuthenticationPrincipal Account account
    ) {
        return ResponseEntity.ok(
                planningService.createPlan(request, account)
        );
    }
}
