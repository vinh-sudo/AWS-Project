package be.backend.service.ai;

import be.backend.model.response.ai.AIProductionSummaryResponse;
import be.backend.model.response.ai.AIRootCauseAnalysisResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AINotificationService {

    private final OpenAIClient openAIClient;

    public NotificationMessage generateHealthAlert(AIProductionSummaryResponse summary) {
        try {
            StringBuilder prompt = new StringBuilder();
            prompt.append("You are an AI assistant that writes alert notifications for production systems. \n");
            prompt.append("Based on the production health summary below, write a short alert title and body in English. ");
            prompt.append("The title should be concise (max ~10 words). The body should be 2-4 sentences, highlighting severity, affected lines, and key actions. ");
            prompt.append("Return the result in this exact JSON format without any extra text: {\\"title\\": \\\"...\\\", \\"body\\": \\\"...\\\"}.\\n\\n");

            prompt.append("PRODUCTION HEALTH SUMMARY:\n");
            prompt.append("- Overall status: ").append(summary.getOverallStatus()).append("\n");
            prompt.append("- Main issue: ").append(summary.getMainIssue()).append("\n");
            prompt.append("- Critical lines: ");
            if (summary.getCriticalLines() == null || summary.getCriticalLines().isEmpty()) {
                prompt.append("None\n");
            } else {
                prompt.append(String.join(", ", summary.getCriticalLines())).append("\n");
            }
            prompt.append("- Recommendations:\n");
            if (summary.getRecommendations() != null && !summary.getRecommendations().isEmpty()) {
                summary.getRecommendations().forEach(r ->
                    prompt.append("  - ").append(r).append("\n")
                );
            } else {
                prompt.append("  - No specific recommendations available\n");
            }

            String raw = openAIClient.ask(prompt.toString());
            return NotificationMessage.fromJson(raw);
        } catch (Exception e) {
            log.error("Error generating AI health alert notification", e);
            return NotificationMessage.fallback("Production Alert", "Critical production issue detected. Please check the production dashboard for more details.");
        }
    }

    public NotificationMessage generateRootCauseAlert(AIRootCauseAnalysisResponse rootCause) {
        try {
            StringBuilder prompt = new StringBuilder();
            prompt.append("You are an AI assistant that writes alert notifications for production systems. \n");
            prompt.append("Based on the root cause analysis below, write a short alert title and body in English. ");
            prompt.append("The title should be concise (max ~10 words). The body should be 2-4 sentences, explaining the main cause, key evidence, and urgent actions. ");
            prompt.append("Return the result in this exact JSON format without any extra text: {\\"title\\": \\\"...\\\", \\"body\\": \\\"...\\\"}.\\n\\n");

            prompt.append("ROOT CAUSE ANALYSIS:\n");
            prompt.append("- Primary root cause: ").append(rootCause.getPrimaryRootCause()).append("\n");
            prompt.append("- Confidence: ").append(rootCause.getConfidence()).append("\n");

            prompt.append("- Contributing factors:\n");
            if (rootCause.getContributingFactors() != null && !rootCause.getContributingFactors().isEmpty()) {
                rootCause.getContributingFactors().forEach(f ->
                    prompt.append("  - ").append(f).append("\n")
                );
            } else {
                prompt.append("  - None listed\n");
            }

            prompt.append("- Evidence points:\n");
            if (rootCause.getEvidencePoints() != null && !rootCause.getEvidencePoints().isEmpty()) {
                rootCause.getEvidencePoints().forEach(e ->
                    prompt.append("  - ").append(e).append("\n")
                );
            } else {
                prompt.append("  - None listed\n");
            }

            prompt.append("- Immediate actions:\n");
            if (rootCause.getImmediateActions() != null && !rootCause.getImmediateActions().isEmpty()) {
                rootCause.getImmediateActions().forEach(a ->
                    prompt.append("  - ").append(a).append("\n")
                );
            } else {
                prompt.append("  - None listed\n");
            }

            prompt.append("- Preventive actions:\n");
            if (rootCause.getPreventiveActions() != null && !rootCause.getPreventiveActions().isEmpty()) {
                rootCause.getPreventiveActions().forEach(a ->
                    prompt.append("  - ").append(a).append("\n")
                );
            } else {
                prompt.append("  - None listed\n");
            }

            String raw = openAIClient.ask(prompt.toString());
            return NotificationMessage.fromJson(raw);
        } catch (Exception e) {
            log.error("Error generating AI root cause alert notification", e);
            return NotificationMessage.fallback("Root Cause Alert", "A significant root cause has been detected. Please review the root cause analysis report.");
        }
    }

    public static class NotificationMessage {
        private final String title;
        private final String body;

        public NotificationMessage(String title, String body) {
            this.title = title;
            this.body = body;
        }

        public String getTitle() {
            return title;
        }

        public String getBody() {
            return body;
        }

        public static NotificationMessage fromJson(String json) {
            // Very simple, defensive parsing without adding a new JSON library
            try {
                String cleaned = json.trim();
                int tIndex = cleaned.indexOf("\"title\"");
                int bIndex = cleaned.indexOf("\"body\"");
                String title = "Alert";
                String body = cleaned;
                if (tIndex >= 0) {
                    int colon = cleaned.indexOf(':', tIndex);
                    int startQuote = cleaned.indexOf('"', colon + 1);
                    int endQuote = cleaned.indexOf('"', startQuote + 1);
                    if (startQuote >= 0 && endQuote > startQuote) {
                        title = cleaned.substring(startQuote + 1, endQuote);
                    }
                }
                if (bIndex >= 0) {
                    int colon = cleaned.indexOf(':', bIndex);
                    int startQuote = cleaned.indexOf('"', colon + 1);
                    int endQuote = cleaned.lastIndexOf('"');
                    if (startQuote >= 0 && endQuote > startQuote) {
                        body = cleaned.substring(startQuote + 1, endQuote);
                    }
                }
                return new NotificationMessage(title, body);
            } catch (Exception e) {
                return fallback("Alert", json);
            }
        }

        public static NotificationMessage fallback(String title, String body) {
            return new NotificationMessage(title, body);
        }
    }
}

