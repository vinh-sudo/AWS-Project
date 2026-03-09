package be.backend.controller.AI;

import be.backend.model.response.ai.AIProductionSummaryResponse;
import be.backend.model.response.ai.AIRootCauseAnalysisResponse;
import be.backend.service.ai.ProductionAnalysisService;
import be.backend.service.ai.AIProductionAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/production-analysis")
@RequiredArgsConstructor
public class AIController {

    private final ProductionAnalysisService analysisService;
    private final AIProductionAnalysisService aiProductionAnalysisService;

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

    @GetMapping("/production-health/ai-summary")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public String getProductionHealthAiSummary() {
        return aiProductionAnalysisService.getProductionHealthAiSummary();
    }

    @GetMapping("/root-cause-analysis/ai-summary")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public String getRootCauseAiSummary() {
        return aiProductionAnalysisService.getRootCauseAiExplanation();
    }

}
