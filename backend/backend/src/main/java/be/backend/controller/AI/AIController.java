package be.backend.controller.AI;

import be.backend.model.response.ai.AIProductionSummaryResponse;
import be.backend.model.response.ai.AIRootCauseAnalysisResponse;
import be.backend.service.ai.ProductionAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/production-analysis")
@RequiredArgsConstructor
public class AIController {

    private final ProductionAnalysisService analysisService;

    @GetMapping("/production-health")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public AIProductionSummaryResponse getProductionHealth() {
        return analysisService.getProductionHealthSummary();
    }


    @GetMapping("/root-cause-analysis")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public AIRootCauseAnalysisResponse performRootCauseAnalysis() {
        return analysisService.performRootCauseAnalysis();
    }

}

