package be.backend.service.ai;

import be.backend.model.ai.AiContextSnapshot;
import be.backend.model.ai.AiDecisionResult;
import be.backend.model.ai.AiRole;
import be.backend.model.response.DelayResponse;
import be.backend.model.response.OeeLineResponse;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class AiDecisionEngine {

    public AiDecisionResult evaluate(AiContextSnapshot snapshot, AiRole role) {
        var stats = snapshot.getProductionOverview();
        List<DelayResponse> delays = snapshot.getDelays();
        List<OeeLineResponse> oeeByLine = snapshot.getOeeByLine();

        int highRiskDelayCount = (int) delays.stream().filter(d -> "HIGH".equalsIgnoreCase(d.getRisk())).count();
        double avgOee = oeeByLine.stream().mapToDouble(OeeLineResponse::getOee).average().orElse(0.0);

        int score = 0;
        if (stats.getAchievementRate() < 0.8) score += 2;
        if (stats.getRejectRate() > 0.05) score += 2;
        if (stats.getTotalDowntimeMinutes() > 180) score += 2;
        if (highRiskDelayCount > 0) score += 2;
        if (avgOee < 0.6) score += 2;

        String systemStatus;
        String riskLevel;
        double confidence;

        if (score >= 7) {
            systemStatus = "CRITICAL";
            riskLevel = "HIGH";
            confidence = 0.9;
        } else if (score >= 4) {
            systemStatus = "WARNING";
            riskLevel = "MEDIUM";
            confidence = 0.8;
        } else {
            systemStatus = "STABLE";
            riskLevel = "LOW";
            confidence = 0.75;
        }

        List<String> findings = new ArrayList<>();
        findings.add(String.format("Achievement rate: %.1f%%", stats.getAchievementRate() * 100));
        findings.add(String.format("Reject rate: %.1f%%", stats.getRejectRate() * 100));
        findings.add("Total downtime: " + stats.getTotalDowntimeMinutes() + " minutes");
        findings.add("High-risk delayed lines: " + highRiskDelayCount);
        findings.add(String.format("Average OEE: %.1f%%", avgOee * 100));

        List<String> evidence = new ArrayList<>();
        delays.stream()
            .sorted(Comparator.comparingInt(DelayResponse::getDelay).reversed())
            .limit(3)
            .forEach(d -> evidence.add(
                String.format("Line %s delayed %d units (risk=%s)", d.getLine(), d.getDelay(), d.getRisk())
            ));

        oeeByLine.stream()
            .sorted(Comparator.comparingDouble(OeeLineResponse::getOee))
            .limit(3)
            .forEach(o -> evidence.add(
                String.format("Line %s OEE %.1f%%", o.getLine(), o.getOee() * 100)
            ));

        if (evidence.isEmpty()) {
            evidence.add("No critical signals detected from delays/OEE data");
        }

        List<String> recommendations = buildRecommendations(role, systemStatus, riskLevel);

        return AiDecisionResult.builder()
            .systemStatus(systemStatus)
            .riskLevel(riskLevel)
            .findings(findings)
            .evidence(evidence)
            .recommendations(recommendations)
            .confidence(confidence)
            .build();
    }

    private List<String> buildRecommendations(AiRole role, String status, String riskLevel) {
        List<String> recommendations = new ArrayList<>();

        if (role == AiRole.ADMIN) {
            recommendations.add("Review cross-line capacity allocation for high-risk lines");
            recommendations.add("Escalate maintenance and quality review for persistent low-OEE lines");
            recommendations.add("Set 24-hour executive checkpoint for delivery-risk orders");
        } else if (role == AiRole.MANAGER) {
            recommendations.add("Prioritize recovery actions on the top delayed lines in the next shift");
            recommendations.add("Assign experienced operators to lines with lowest OEE");
            recommendations.add("Re-check schedule feasibility and rebalance tasks for at-risk orders");
        } else {
            recommendations.add("Review current production status with authorized admin or manager");
            recommendations.add("Validate role permissions before requesting role-specific recommendations");
        }

        if ("CRITICAL".equals(status) || "HIGH".equals(riskLevel)) {
            recommendations.add("Trigger incident protocol and update stakeholders immediately");
        }

        return recommendations;
    }
}
