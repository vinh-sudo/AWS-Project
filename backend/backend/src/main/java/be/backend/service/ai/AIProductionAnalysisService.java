package be.backend.service.ai;

import be.backend.model.response.ai.AIProductionSummaryResponse;
import be.backend.model.response.ai.AIRootCauseAnalysisResponse;
import be.backend.model.response.DelayResponse;
import be.backend.model.response.OeeLineResponse;
import be.backend.model.response.statistics.ProductionOverviewResponse;
import be.backend.service.manager.DelayService;
import be.backend.service.manager.OeeService;
import be.backend.service.statistics.ManagerStatisticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIProductionAnalysisService {

    private final DelayService delayService;
    private final OeeService oeeService;
    private final ManagerStatisticsService statisticsService;
    private final OpenAIClient openAIClient;

    public AIProductionSummaryResponse analyzeProduction() {
        try {
            var delayData = delayService.getTodayDelay();
            var oeeData = oeeService.getTodayOee();
            var stats = statisticsService.getTodayStatistics();

            String prompt = buildPrompt(delayData, oeeData, stats);
            String aiRawResponse = openAIClient.ask(prompt);

            return parseResponse(aiRawResponse, delayData, oeeData);
        } catch (Exception e) {
            log.error("Error analyzing production", e);
            return buildFallbackResponse(delayService.getTodayDelay(), oeeService.getTodayOee());
        }
    }

    private String buildPrompt(List<DelayResponse> delays, List<OeeLineResponse> oeeData, ProductionOverviewResponse stats) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("Analyze today's production status and provide a health summary.\n\n");

        // Production Overview
        prompt.append("PRODUCTION OVERVIEW:\n");
        prompt.append("- Total Good: ").append(stats.getTotalGood()).append("\n");
        prompt.append("- Total Target: ").append(stats.getTotalTarget()).append("\n");
        prompt.append("- Achievement Rate: ").append(stats.getAchievementRate()).append("%\n");
        prompt.append("- Reject Rate: ").append(stats.getRejectRate()).append("%\n");
        prompt.append("- Total Downtime: ").append(stats.getTotalDowntimeMinutes()).append(" minutes\n\n");

        // Special handling for no production scenario
        if (stats.getTotalGood() == 0 && stats.getTotalTarget() == 0) {
            prompt.append("⚠️ CRITICAL ALERT: No production output or targets recorded today.\n");
            prompt.append("This indicates a complete production halt or system failure.\n\n");
        }

        // Delay Analysis
        prompt.append("DELAY ANALYSIS:\n");
        if (delays.isEmpty()) {
            prompt.append("- No delay data available");
            if (stats.getTotalGood() == 0) {
                prompt.append(" (possible system-wide halt)");
            }
            prompt.append("\n");
        } else {
            for (DelayResponse delay : delays) {
                prompt.append("- ").append(delay.getLine())
                      .append(": ").append(delay.getDelay()).append(" units behind (")
                      .append(delay.getRisk()).append(" risk)\n");
            }
        }
        prompt.append("\n");

        // OEE Analysis
        prompt.append("OEE ANALYSIS:\n");
        if (oeeData.isEmpty()) {
            prompt.append("- No OEE data available from any production line\n");
            prompt.append("- This suggests a complete system failure or data collection issue\n");
        } else {
            for (OeeLineResponse oee : oeeData) {
                prompt.append("- ").append(oee.getLine())
                      .append(": OEE=").append(String.format("%.1f", oee.getOee() * 100)).append("%");

                if (oee.getOee() == 0.0) {
                    prompt.append(" (STOPPED)");
                }

                prompt.append(" (A=").append(String.format("%.1f", oee.getAvailability() * 100))
                      .append("%, P=").append(String.format("%.1f", oee.getPerformance() * 100))
                      .append("%, Q=").append(String.format("%.1f", oee.getQuality() * 100)).append("%)\n");
            }
        }

        prompt.append("\n");
        prompt.append("IMPORTANT CONTEXT:\n");
        prompt.append("- If total production is 0 with no targets, this indicates complete system halt\n");
        prompt.append("- If OEE data is missing, this suggests data collection or system connectivity issues\n");
        prompt.append("- Zero OEE on all lines indicates equipment failure or power issues\n\n");

        prompt.append("Based on this data, provide:\n");
        prompt.append("1. Overall Status: STABLE, WARNING, or CRITICAL\n");
        prompt.append("2. Main Issue: Brief description focusing on root cause (system halt, equipment failure, etc.)\n");
        prompt.append("3. Critical Lines: Specific line names needing attention, or 'All Production Lines' if system-wide\n");
        prompt.append("4. Recommendations: 2-4 specific actionable steps prioritizing emergency response if needed\n\n");
        prompt.append("Respond in this format:\n");
        prompt.append("STATUS: [status]\n");
        prompt.append("ISSUE: [main issue]\n");
        prompt.append("CRITICAL: [line names separated by comma, or 'All Production Lines' for system-wide issues]\n");
        prompt.append("RECOMMENDATIONS:\n- [recommendation 1]\n- [recommendation 2]\n- [recommendation 3]\n- [recommendation 4]");

        return prompt.toString();
    }

    private AIProductionSummaryResponse parseResponse(String response, List<DelayResponse> delays, List<OeeLineResponse> oeeData) {
        try {
            String[] lines = response.split("\n");

            String status = "WARNING";
            String mainIssue = "Analysis in progress";
            List<String> criticalLines = new ArrayList<>();
            List<String> recommendations = new ArrayList<>();

            boolean inRecommendations = false;

            for (String line : lines) {
                line = line.trim();

                if (line.startsWith("STATUS:")) {
                    status = line.substring(7).trim();
                } else if (line.startsWith("ISSUE:")) {
                    mainIssue = line.substring(6).trim();
                } else if (line.startsWith("CRITICAL:")) {
                    String criticalText = line.substring(9).trim();
                    if (!criticalText.equalsIgnoreCase("NONE")) {
                        criticalLines = List.of(criticalText.split(","))
                            .stream()
                            .map(String::trim)
                            .collect(Collectors.toList());
                    }
                } else if (line.equals("RECOMMENDATIONS:")) {
                    inRecommendations = true;
                } else if (inRecommendations && line.startsWith("- ")) {
                    recommendations.add(line.substring(2).trim());
                }
            }

            // Fallback: detect critical lines from data if AI didn't identify them properly
            if (criticalLines.isEmpty()) {
                criticalLines = detectCriticalLinesFromData(delays, oeeData);
            }

            return AIProductionSummaryResponse.builder()
                .overallStatus(status)
                .mainIssue(mainIssue)
                .criticalLines(criticalLines)
                .recommendations(recommendations)
                .build();

        } catch (Exception e) {
            log.error("Error parsing AI response", e);
            return buildFallbackResponse(delays, oeeData);
        }
    }


    private AIProductionSummaryResponse buildFallbackResponse(List<DelayResponse> delays, List<OeeLineResponse> oeeData) {
        String status = "WARNING";
        String mainIssue = "System analysis";
        List<String> criticalLines = detectCriticalLinesFromData(delays, oeeData);

        // Determine status based on data
        if (!delays.isEmpty() && delays.stream().anyMatch(d -> "HIGH".equals(d.getRisk()))) {
            status = "CRITICAL";
            mainIssue = "High production delays detected";
        } else if (oeeData.stream().anyMatch(o -> o.getOee() < 0.6)) {
            status = "WARNING";
            mainIssue = "Low OEE performance on some lines";
        } else {
            status = "STABLE";
            mainIssue = "Production running normally";
        }

        List<String> recommendations = List.of(
            "Monitor critical lines closely",
            "Review maintenance schedules",
            "Check production parameters"
        );

        return AIProductionSummaryResponse.builder()
            .overallStatus(status)
            .mainIssue(mainIssue)
            .criticalLines(criticalLines)
            .recommendations(recommendations)
            .build();
    }

    /**
     * 🔍 AI Root Cause Analysis - Intelligent problem diagnosis
     * Analyzes production metrics to identify root causes:
     * - High reject + low downtime → Quality issues
     * - High downtime + low OEE → Equipment problems
     * - High delays + normal OEE → Capacity/planning issues
     */
    public AIRootCauseAnalysisResponse performRootCauseAnalysis() {
        try {
            var delayData = delayService.getTodayDelay();
            var oeeData = oeeService.getTodayOee();
            var stats = statisticsService.getTodayStatistics();

            // Intelligent root cause analysis
            RootCauseResult analysis = analyzeRootCause(delayData, oeeData, stats);

            return AIRootCauseAnalysisResponse.builder()
                .primaryRootCause(analysis.primaryCause)
                .confidence(analysis.confidence)
                .contributingFactors(analysis.contributingFactors)
                .evidencePoints(analysis.evidencePoints)
                .immediateActions(analysis.immediateActions)
                .preventiveActions(analysis.preventiveActions)
                .build();

        } catch (Exception e) {
            log.error("Error performing root cause analysis", e);
            return AIRootCauseAnalysisResponse.builder()
                .primaryRootCause("Analysis unavailable")
                .confidence("LOW")
                .contributingFactors(List.of("System analysis error"))
                .evidencePoints(List.of("Unable to collect sufficient data"))
                .immediateActions(List.of("Check system connectivity", "Verify data sources"))
                .preventiveActions(List.of("Monitor system health", "Review data collection processes"))
                .build();
        }
    }

    /**
     * Core root cause analysis logic using intelligent pattern recognition
     */
    private RootCauseResult analyzeRootCause(List<DelayResponse> delays, List<OeeLineResponse> oeeData, ProductionOverviewResponse stats) {
        RootCauseResult result = new RootCauseResult();

        // Calculate key metrics for analysis
        double avgOEE = oeeData.stream().mapToDouble(o -> o.getOee()).average().orElse(0.0);
        double rejectRate = stats.getRejectRate();
        double achievementRate = stats.getAchievementRate();
        long totalDowntime = stats.getTotalDowntimeMinutes();
        boolean hasHighDelays = delays.stream().anyMatch(d -> "HIGH".equals(d.getRisk()));
        boolean hasMediumDelays = delays.stream().anyMatch(d -> "MEDIUM".equals(d.getRisk()));

        // Pattern 1: Quality Issues (High reject + Normal/Low downtime)
        if (rejectRate > 3.0 && totalDowntime < 120 && avgOEE > 0.6) {
            result.primaryCause = "Quality Control Issues";
            result.confidence = "HIGH";
            result.contributingFactors = List.of(
                String.format("High reject rate: %.1f%% (threshold: 3%%)", rejectRate),
                "Equipment running but producing defects",
                "Possible calibration or material quality issues"
            );
            result.evidencePoints = List.of(
                String.format("Reject rate %.1f%% above acceptable threshold", rejectRate),
                String.format("Low downtime (%d minutes) indicates equipment availability", totalDowntime),
                String.format("OEE %.1f%% shows equipment capability", avgOEE * 100)
            );
            result.immediateActions = List.of(
                "Stop production and inspect quality control processes",
                "Check calibration of quality inspection equipment",
                "Review incoming material quality certificates",
                "Retrain operators on quality procedures"
            );
            result.preventiveActions = List.of(
                "Implement real-time quality monitoring",
                "Establish regular calibration schedules",
                "Improve supplier quality agreements",
                "Enhance operator training programs"
            );
            return result;
        }

        // Pattern 2: Equipment Problems (High downtime + Low OEE)
        if (totalDowntime > 180 && avgOEE < 0.5) {
            result.primaryCause = "Equipment Reliability Issues";
            result.confidence = "HIGH";
            result.contributingFactors = List.of(
                String.format("Excessive downtime: %d minutes", totalDowntime),
                String.format("Low OEE: %.1f%% indicates equipment problems", avgOEE * 100),
                "Frequent equipment failures or maintenance needs"
            );
            result.evidencePoints = List.of(
                String.format("Downtime %d minutes exceeds threshold (180 min)", totalDowntime),
                String.format("OEE %.1f%% below minimum acceptable level (50%%)", avgOEE * 100),
                "Pattern indicates mechanical or electrical issues"
            );
            result.immediateActions = List.of(
                "Conduct emergency maintenance assessment",
                "Check critical equipment components",
                "Review recent maintenance logs",
                "Bring in specialized maintenance team if needed"
            );
            result.preventiveActions = List.of(
                "Implement predictive maintenance program",
                "Increase frequency of preventive maintenance",
                "Upgrade aging equipment components",
                "Establish equipment reliability monitoring"
            );
            return result;
        }

        // Pattern 3: Capacity/Planning Issues (High delays + Normal OEE)
        if (hasHighDelays && avgOEE > 0.7 && achievementRate < 80) {
            result.primaryCause = "Capacity Planning and Scheduling Issues";
            result.confidence = "HIGH";
            result.contributingFactors = List.of(
                "High production delays despite good equipment performance",
                String.format("OEE %.1f%% shows equipment capability", avgOEE * 100),
                String.format("Achievement rate %.1f%% indicates planning mismatch", achievementRate)
            );
            result.evidencePoints = List.of(
                "Equipment running efficiently but missing targets",
                "Delays suggest unrealistic scheduling or capacity constraints",
                "Good OEE but poor achievement indicates planning issues"
            );
            result.immediateActions = List.of(
                "Review production schedules and capacity allocation",
                "Reassess production targets against actual capacity",
                "Check for bottlenecks in production flow",
                "Optimize work scheduling and resource allocation"
            );
            result.preventiveActions = List.of(
                "Implement advanced production planning system",
                "Conduct regular capacity vs demand analysis",
                "Establish realistic target-setting processes",
                "Improve production flow optimization"
            );
            return result;
        }

        // Pattern 4: Mixed Issues (Multiple problems)
        if ((rejectRate > 2.0 && totalDowntime > 120) || (hasHighDelays && avgOEE < 0.6)) {
            result.primaryCause = "Multiple Operational Issues";
            result.confidence = "MEDIUM";
            result.contributingFactors = List.of(
                "Combination of quality, equipment, and scheduling issues",
                String.format("Reject rate: %.1f%%, Downtime: %d min, OEE: %.1f%%", rejectRate, totalDowntime, avgOEE * 100),
                "Systemic operational inefficiencies"
            );
            result.evidencePoints = List.of(
                "Multiple metrics showing suboptimal performance",
                "Indicates need for comprehensive operational review",
                "Complex root cause requiring multi-faceted approach"
            );
            result.immediateActions = List.of(
                "Conduct comprehensive operational assessment",
                "Prioritize issues by impact and urgency",
                "Form cross-functional problem-solving team",
                "Implement temporary controls on critical processes"
            );
            result.preventiveActions = List.of(
                "Establish integrated operational excellence program",
                "Implement continuous improvement methodology",
                "Create comprehensive monitoring dashboard",
                "Regular operational health assessments"
            );
            return result;
        }

        // Pattern 5: Normal Operations
        if (avgOEE > 0.8 && rejectRate < 2.0 && totalDowntime < 60 && !hasHighDelays) {
            result.primaryCause = "Operations Within Normal Parameters";
            result.confidence = "HIGH";
            result.contributingFactors = List.of(
                "All key metrics within acceptable ranges",
                String.format("OEE %.1f%% excellent", avgOEE * 100),
                "Minor optimization opportunities exist"
            );
            result.evidencePoints = List.of(
                String.format("OEE %.1f%% above target (80%%)", avgOEE * 100),
                String.format("Reject rate %.1f%% acceptable", rejectRate),
                String.format("Downtime %d minutes minimal", totalDowntime)
            );
            result.immediateActions = List.of(
                "Continue current operations",
                "Monitor for any performance degradation",
                "Look for continuous improvement opportunities"
            );
            result.preventiveActions = List.of(
                "Maintain current operational standards",
                "Regular performance reviews",
                "Incremental process improvements",
                "Share best practices across teams"
            );
            return result;
        }

        // Default: Insufficient data pattern
        result.primaryCause = "Insufficient Data for Clear Root Cause Analysis";
        result.confidence = "LOW";
        result.contributingFactors = List.of(
            "Mixed performance indicators",
            "Need more detailed operational data",
            "Pattern not clearly matching known signatures"
        );
        result.evidencePoints = List.of(
            "Available metrics do not show clear patterns",
            "Requires deeper investigation",
            "May need additional data sources"
        );
        result.immediateActions = List.of(
            "Collect more detailed operational data",
            "Conduct manual inspection of processes",
            "Interview operators and maintenance staff"
        );
        result.preventiveActions = List.of(
            "Enhance data collection systems",
            "Implement more granular monitoring",
            "Establish clearer operational baselines"
        );
        return result;
    }

    /**
     * Internal class to hold root cause analysis results
     */
    private static class RootCauseResult {
        String primaryCause;
        String confidence;
        List<String> contributingFactors;
        List<String> evidencePoints;
        List<String> immediateActions;
        List<String> preventiveActions;
    }

    public String getProductionHealthAiSummary() {
        try {
            // Use logic-based summary from ProductionAnalysisService via data + same rules implicitly
            var delayData = delayService.getTodayDelay();
            var oeeData = oeeService.getTodayOee();
            var stats = statisticsService.getTodayStatistics();

            // Reuse parse logic to get a structured AIProductionSummaryResponse from model
            String prompt = buildPrompt(delayData, oeeData, stats);
            String aiRawResponse = openAIClient.ask(prompt);
            AIProductionSummaryResponse summary = parseResponse(aiRawResponse, delayData, oeeData);

            StringBuilder promptSummary = new StringBuilder();
            promptSummary.append("You are an AI assistant for production managers. \n");
            promptSummary.append("Based on the structured health summary below, write a short executive summary in clear English (3-6 sentences). ");
            promptSummary.append("Focus on overall status, main issues, critical lines, and key recommended actions. Avoid repeating raw labels, explain them naturally.\\n\\n");

            promptSummary.append("PRODUCTION HEALTH SUMMARY:\n");
            promptSummary.append("- Overall status: ").append(summary.getOverallStatus()).append("\n");
            promptSummary.append("- Main issue: ").append(summary.getMainIssue()).append("\n");

            promptSummary.append("- Critical lines: ");
            if (summary.getCriticalLines() == null || summary.getCriticalLines().isEmpty()) {
                promptSummary.append("None\n");
            } else {
                promptSummary.append(String.join(", ", summary.getCriticalLines())).append("\n");
            }

            promptSummary.append("- Recommendations:\n");
            if (summary.getRecommendations() != null && !summary.getRecommendations().isEmpty()) {
                summary.getRecommendations().forEach(rec ->
                    promptSummary.append("  - ").append(rec).append("\n")
                );
            } else {
                promptSummary.append("  - No specific recommendations available\n");
            }

            promptSummary.append("\nWrite the summary as if you are briefing a production manager who has limited time.\n");

            return openAIClient.ask(promptSummary.toString());
        } catch (Exception e) {
            log.error("Error generating AI executive summary for production health", e);
            return "Unable to generate AI executive summary at the moment. Please refer to the structured production health data instead.";
        }
    }

    public String getRootCauseAiSummary() {
        try {
            var delayData = delayService.getTodayDelay();
            var oeeData = oeeService.getTodayOee();
            var stats = statisticsService.getTodayStatistics();

            RootCauseResult analysis = analyzeRootCause(delayData, oeeData, stats);

            StringBuilder prompt = new StringBuilder();
            prompt.append("You are an AI assistant for production managers. \n");
            prompt.append("Based on the structured root cause analysis below, write a short explanation in clear English (3-6 sentences). ");
            prompt.append("Clearly explain the main root cause, why you think so, the most important evidence, and what immediate and preventive actions should be prioritized.\\n\\n");

            prompt.append("ROOT CAUSE ANALYSIS:\n");
            prompt.append("- Primary root cause: ").append(analysis.primaryCause).append("\n");
            prompt.append("- Confidence: ").append(analysis.confidence).append("\n");

            prompt.append("- Contributing factors:\n");
            if (analysis.contributingFactors != null && !analysis.contributingFactors.isEmpty()) {
                analysis.contributingFactors.forEach(f ->
                    prompt.append("  - ").append(f).append("\n")
                );
            } else {
                prompt.append("  - None listed\n");
            }

            prompt.append("- Evidence points:\n");
            if (analysis.evidencePoints != null && !analysis.evidencePoints.isEmpty()) {
                analysis.evidencePoints.forEach(e ->
                    prompt.append("  - ").append(e).append("\n")
                );
            } else {
                prompt.append("  - None listed\n");
            }

            prompt.append("- Immediate actions:\n");
            if (analysis.immediateActions != null && !analysis.immediateActions.isEmpty()) {
                analysis.immediateActions.forEach(a ->
                    prompt.append("  - ").append(a).append("\n")
                );
            } else {
                prompt.append("  - None listed\n");
            }

            prompt.append("- Preventive actions:\n");
            if (analysis.preventiveActions != null && !analysis.preventiveActions.isEmpty()) {
                analysis.preventiveActions.forEach(a ->
                    prompt.append("  - ").append(a).append("\n")
                );
            } else {
                prompt.append("  - None listed\n");
            }

            prompt.append("\nWrite the explanation as if you are briefing a production manager about what went wrong and what to do next.\n");

            return openAIClient.ask(prompt.toString());
        } catch (Exception e) {
            log.error("Error generating AI summary for root cause analysis", e);
            return "Unable to generate AI root cause summary at the moment. Please refer to the structured root cause analysis data instead.";
        }
    }

    private List<String> detectCriticalLinesFromData(List<DelayResponse> delays, List<OeeLineResponse> oeeData) {
        List<String> critical = new ArrayList<>();

        // If no OEE data at all, this indicates a serious system issue
        if (oeeData.isEmpty()) {
            log.warn("No OEE data available - potential system-wide production halt");
            return List.of("All Production Lines"); // Indicate system-wide issue
        }

        // Check for lines with zero OEE (complete halt)
        for (OeeLineResponse oee : oeeData) {
            if (oee.getOee() == 0.0) {
                critical.add(oee.getLine());
            }
        }

        // High delay = critical
        for (DelayResponse delay : delays) {
            if ("HIGH".equals(delay.getRisk())) {
                if (!critical.contains(delay.getLine())) {
                    critical.add(delay.getLine());
                }
            }
        }

        // Low OEE = critical (but not zero, which is already handled above)
        for (OeeLineResponse oee : oeeData) {
            if (oee.getOee() > 0.0 && oee.getOee() < 0.6) { // Between 0% and 60% OEE
                if (!critical.contains(oee.getLine())) {
                    critical.add(oee.getLine());
                }
            }
        }

        return critical;
    }

    /**
     * Internal class to hold root cause analysis results
     */
    private static class RootCauseResult {
        String primaryCause;
        String confidence;
        List<String> contributingFactors;
        List<String> evidencePoints;
        List<String> immediateActions;
        List<String> preventiveActions;
    }
}
