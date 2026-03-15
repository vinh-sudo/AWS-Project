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

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductionAnalysisService {

    private final DelayService delayService;
    private final OeeService oeeService;
    private final ManagerStatisticsService statisticsService;

    // 📊 "Tình trạng sản xuất hôm nay" - Simplified health summary
    public AIProductionSummaryResponse getProductionHealthSummary() {
        try {
            var delayData = delayService.getTodayDelay();
            var oeeData = oeeService.getTodayOee();
            var stats = statisticsService.getTodayStatistics();

            String status = determineOverallStatus(delayData, oeeData, stats);
            List<String> criticalLines = detectCriticalLinesFromData(delayData, oeeData);
            String mainIssue = determineMainIssue(delayData, oeeData, stats);

            return AIProductionSummaryResponse.builder()
                .overallStatus(status)
                .mainIssue(mainIssue)
                .criticalLines(criticalLines)
                .recommendations(generateBasicRecommendations(status, criticalLines))
                .build();
        } catch (Exception e) {
            log.error("Error getting production health summary", e);
            return AIProductionSummaryResponse.builder()
                .overallStatus("WARNING")
                .mainIssue("System analysis unavailable")
                .criticalLines(List.of())
                .recommendations(List.of("Please check system status manually"))
                .build();
        }
    }

    // 🔍 Root Cause Analysis - Intelligent problem diagnosis (pure logic)
    public AIRootCauseAnalysisResponse performRootCauseAnalysis() {
        try {
            var delayData = delayService.getTodayDelay();
            var oeeData = oeeService.getTodayOee();
            var stats = statisticsService.getTodayStatistics();

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

    // --- Core health status logic (moved from AIProductionAnalysisService) ---

    private String determineOverallStatus(List<DelayResponse> delays, List<OeeLineResponse> oeeData, ProductionOverviewResponse stats) {
        boolean completeHalt = (stats.getTotalGood() == 0 && stats.getTotalTarget() == 0) || oeeData.isEmpty();
        boolean allLinesStopped = !oeeData.isEmpty() && oeeData.stream().allMatch(o -> o.getOee() == 0.0);
        boolean noOutputWithTargets = (stats.getTotalGood() == 0 && stats.getTotalTarget() > 0);

        if (completeHalt || allLinesStopped || noOutputWithTargets) {
            return "CRITICAL";
        }

        boolean hasHighDelays = delays.stream().anyMatch(d -> "HIGH".equals(d.getRisk()));
        boolean hasVeryLowOee = oeeData.stream().anyMatch(o -> o.getOee() > 0.0 && o.getOee() < 0.5);
        boolean hasLowAchievement = stats.getAchievementRate() < 60.0;

        if (hasHighDelays || hasVeryLowOee || hasLowAchievement) {
            return "CRITICAL";
        }

        boolean hasMediumDelays = delays.stream().anyMatch(d -> "MEDIUM".equals(d.getRisk()));
        boolean hasLowOee = oeeData.stream().anyMatch(o -> o.getOee() >= 0.5 && o.getOee() < 0.7);
        boolean hasMediumAchievement = stats.getAchievementRate() < 80.0;
        boolean hasMultipleStoppedLines = oeeData.stream().filter(o -> o.getOee() == 0.0).count() > 1;

        if (hasMediumDelays || hasLowOee || hasMediumAchievement || hasMultipleStoppedLines) {
            return "WARNING";
        }

        return "STABLE";
    }

    private String determineMainIssue(List<DelayResponse> delays, List<OeeLineResponse> oeeData, ProductionOverviewResponse stats) {
        if (stats.getTotalGood() == 0 && stats.getTotalTarget() == 0) {
            if (oeeData.isEmpty()) {
                return "Complete system halt - No production data available from any line";
            }

            long stoppedLines = oeeData.stream().filter(o -> o.getOee() == 0.0).count();
            if (stoppedLines == oeeData.size()) {
                return String.format("Complete production halt - All %d production lines offline", stoppedLines);
            } else if (stoppedLines > 0) {
                return String.format("Partial production halt - %d of %d lines stopped", stoppedLines, oeeData.size());
            }
        }

        if (stats.getTotalGood() == 0 && stats.getTotalTarget() > 0) {
            return "Production failure - No output despite having production targets";
        }

        List<DelayResponse> highDelays = delays.stream()
            .filter(d -> "HIGH".equals(d.getRisk()))
            .toList();

        if (!highDelays.isEmpty()) {
            String lines = highDelays.stream()
                .map(DelayResponse::getLine)
                .collect(Collectors.joining(", "));
            return "High production delays on " + lines;
        }

        List<OeeLineResponse> lowOeeLines = oeeData.stream()
            .filter(o -> o.getOee() > 0.0 && o.getOee() < 0.6)
            .toList();

        if (!lowOeeLines.isEmpty()) {
            String lines = lowOeeLines.stream()
                .map(OeeLineResponse::getLine)
                .collect(Collectors.joining(", "));
            return "Low OEE performance on " + lines;
        }

        if (stats.getAchievementRate() < 80.0) {
            return String.format("Achievement rate below target (%.1f%%)", stats.getAchievementRate());
        }

        if (stats.getTotalDowntimeMinutes() > 120) {
            return String.format("High downtime detected (%d minutes)", stats.getTotalDowntimeMinutes());
        }

        return "Production running normally";
    }

    private List<String> generateBasicRecommendations(String status, List<String> criticalLines) {
        List<String> recommendations = new ArrayList<>();

        if ("CRITICAL".equals(status)) {
            if (criticalLines.contains("All Production Lines") || criticalLines.size() >= 3) {
                recommendations.add("EMERGENCY: Complete production halt detected - Initiate emergency response protocol");
                recommendations.add("Check main power supply, network connectivity, and central control systems immediately");
                recommendations.add("Contact maintenance team and production manager for urgent system-wide investigation");
                recommendations.add("Verify database connectivity and data logging systems functionality");
            } else if (!criticalLines.isEmpty()) {
                recommendations.add("Immediate attention required for critical lines: " + String.join(", ", criticalLines));
                recommendations.add("Stop production on affected lines and conduct thorough investigation");
                recommendations.add("Escalate to production manager and maintenance team immediately");
            } else {
                recommendations.add("Critical production issues detected - Immediate investigation required");
                recommendations.add("Check all production systems and equipment status");
                recommendations.add("Review recent operational changes and system logs");
            }
        } else if ("WARNING".equals(status)) {
            recommendations.add("Monitor production closely for deteriorating conditions");
            if (!criticalLines.isEmpty()) {
                recommendations.add("Review performance on " + String.join(", ", criticalLines));
                recommendations.add("Consider preventive maintenance on underperforming lines");
            }
            recommendations.add("Check maintenance schedules and resource allocation");
        } else {
            recommendations.add("Continue normal operations");
            recommendations.add("Maintain current production parameters");
            recommendations.add("Keep monitoring for any changes");
        }

        return recommendations;
    }

    private List<String> detectCriticalLinesFromData(List<DelayResponse> delays, List<OeeLineResponse> oeeData) {
        List<String> critical = new ArrayList<>();

        if (oeeData.isEmpty()) {
            log.warn("No OEE data available - potential system-wide production halt");
            return List.of("All Production Lines");
        }

        for (OeeLineResponse oee : oeeData) {
            if (oee.getOee() == 0.0) {
                critical.add(oee.getLine());
            }
        }

        for (DelayResponse delay : delays) {
            if ("HIGH".equals(delay.getRisk()) && !critical.contains(delay.getLine())) {
                critical.add(delay.getLine());
            }
        }

        for (OeeLineResponse oee : oeeData) {
            if (oee.getOee() > 0.0 && oee.getOee() < 0.6 && !critical.contains(oee.getLine())) {
                critical.add(oee.getLine());
            }
        }

        return critical;
    }

    // --- Root cause analysis logic (moved from AIProductionAnalysisService.analyzeRootCause) ---

    private RootCauseResult analyzeRootCause(List<DelayResponse> delays, List<OeeLineResponse> oeeData, ProductionOverviewResponse stats) {
        RootCauseResult result = new RootCauseResult();

        double avgOEE = oeeData.stream().mapToDouble(o -> o.getOee()).average().orElse(0.0);
        double rejectRate = stats.getRejectRate();
        double achievementRate = stats.getAchievementRate();
        long totalDowntime = stats.getTotalDowntimeMinutes();
        boolean hasHighDelays = delays.stream().anyMatch(d -> "HIGH".equals(d.getRisk()));

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

    private static class RootCauseResult {
        String primaryCause;
        String confidence;
        List<String> contributingFactors;
        List<String> evidencePoints;
        List<String> immediateActions;
        List<String> preventiveActions;
    }
}

