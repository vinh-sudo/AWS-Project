package be.backend.service.ai;

import be.backend.model.request.ai.AIChatRequest;
import be.backend.model.response.ai.AIChatResponse;
import be.backend.model.response.DelayResponse;
import be.backend.model.response.OeeLineResponse;
import be.backend.model.response.statistics.ProductionOverviewResponse;
import be.backend.service.manager.DelayService;
import be.backend.service.manager.OeeService;
import be.backend.service.statistics.ManagerStatisticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Arrays;


@Service
@RequiredArgsConstructor
@Slf4j
public class AIChatService {

    private final OpenAIClient openAIClient;
    private final DelayService delayService;
    private final OeeService oeeService;
    private final ManagerStatisticsService statisticsService;


    public AIChatResponse processChat(AIChatRequest request) {
        try {
            log.info("Processing AI chat: {}", request.getMessage());

            // Build context with current production data
            String contextualPrompt = buildChatPrompt(request.getMessage());

            // Get AI response
            String aiResponse = openAIClient.ask(contextualPrompt);

            return AIChatResponse.builder()
                .response(aiResponse)
                .sessionId(request.getSessionId())
                .timestamp(LocalDateTime.now())
                .success(true)
                .suggestedQuestions(generateSuggestedQuestions(request.getMessage()))
                .responseType("TEXT")
                .build();

        } catch (Exception e) {
            log.error("Error processing AI chat", e);
            return AIChatResponse.builder()
                .response("Sorry, I am experiencing technical issues. Please try again later.")
                .sessionId(request.getSessionId())
                .timestamp(LocalDateTime.now())
                .success(false)
                .suggestedQuestions(getDefaultQuestions())
                .responseType("TEXT")
                .build();
        }
    }


    public AIChatResponse getQuickProductionStatus() {
        try {
            var delayData = delayService.getTodayDelay();
            var oeeData = oeeService.getTodayOee();
            var stats = statisticsService.getTodayStatistics();

            String prompt = buildQuickStatusPrompt(delayData, oeeData, stats);
            String aiResponse = openAIClient.ask(prompt);

            return AIChatResponse.builder()
                .response(aiResponse)
                .sessionId("quick-status-" + System.currentTimeMillis())
                .timestamp(LocalDateTime.now())
                .success(true)
                .suggestedQuestions(Arrays.asList(
                    "Analyze detailed root causes?",
                    "Provide concrete improvement recommendations?",
                    "Compare with yesterday's performance?"
                ))
                .responseType("TEXT")
                .build();

        } catch (Exception e) {
            log.error("Error getting quick status", e);
            return getErrorResponse("quick-status");
        }
    }

    private String buildChatPrompt(String userMessage) {
        StringBuilder prompt = new StringBuilder();

        // System context
        prompt.append("You are an AI Production Assistant specialized in manufacturing. ");
        prompt.append("You are smart, helpful and always answer in English.\n\n");

        // Add current production context
        try {
            var delayData = delayService.getTodayDelay();
            var oeeData = oeeService.getTodayOee();
            var stats = statisticsService.getTodayStatistics();

            prompt.append("CURRENT PRODUCTION DATA:\n");
            prompt.append("- Plan achievement rate: ").append(stats.getAchievementRate()).append("%\n");
            prompt.append("- Reject rate: ").append(stats.getRejectRate()).append("%\n");
            prompt.append("- Total downtime: ").append(stats.getTotalDowntimeMinutes()).append(" minutes\n");

            if (!delayData.isEmpty()) {
                prompt.append("- Delayed lines: ");
                delayData.forEach(delay ->
                    prompt.append(delay.getLine()).append(" (")
                          .append(delay.getDelay()).append(" units behind), ")
                );
                prompt.append("\n");
            }

            if (!oeeData.isEmpty()) {
                prompt.append("- OEE by line: ");
                oeeData.forEach(oee ->
                    prompt.append(oee.getLine()).append(" (")
                          .append(String.format("%.1f", oee.getOee() * 100)).append("%), ")
                );
                prompt.append("\n");
            }

        } catch (Exception e) {
            log.warn("Could not load production context", e);
        }

        prompt.append("\nUSER QUESTION: ").append(userMessage).append("\n\n");

        prompt.append("Answer the question based on the current production data. ");
        prompt.append("If deeper analysis is needed, provide concrete insights. ");
        prompt.append("If information is insufficient, clearly say so and suggest next steps. ");
        prompt.append("Keep the answer concise, clear and helpful.");

        return prompt.toString();
    }


    private String buildQuickStatusPrompt(List<DelayResponse> delays, List<OeeLineResponse> oeeData, ProductionOverviewResponse stats) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("You are an AI Production Assistant. Summarize the current production status in English:\n\n");

        prompt.append("TODAY'S PRODUCTION DATA:\n");
        prompt.append("- Plan achievement rate: ").append(stats.getAchievementRate()).append("%\n");
        prompt.append("- Reject rate: ").append(stats.getRejectRate()).append("%\n");
        prompt.append("- Total downtime: ").append(stats.getTotalDowntimeMinutes()).append(" minutes\n");
        prompt.append("- Total good products: ").append(stats.getTotalGood()).append("/").append(stats.getTotalTarget()).append("\n\n");

        if (!delays.isEmpty()) {
            prompt.append("LINES WITH SIGNIFICANT DELAY:\n");
            delays.forEach(delay ->
                prompt.append("- ").append(delay.getLine()).append(": ")
                      .append(delay.getDelay()).append(" units behind (risk: ")
                      .append(delay.getRisk()).append(")\n")
            );
            prompt.append("\n");
        }

        if (!oeeData.isEmpty()) {
            prompt.append("OEE BY LINE:\n");
            oeeData.forEach(oee ->
                prompt.append("- ").append(oee.getLine()).append(": ")
                      .append(String.format("%.1f", oee.getOee() * 100)).append("% ")
                      .append("(Availability: ").append(String.format("%.1f", oee.getAvailability() * 100))
                      .append("%, Performance: ").append(String.format("%.1f", oee.getPerformance() * 100))
                      .append("%, Quality: ").append(String.format("%.1f", oee.getQuality() * 100)).append("%)\n")
            );
            prompt.append("\n");
        }

        prompt.append("Evaluate the overall situation, highlight strengths/weaknesses and provide 2-3 concrete recommendations. ");
        prompt.append("Respond in short, clear English.");

        return prompt.toString();
    }


    private List<String> generateSuggestedQuestions(String userMessage) {
        String msg = userMessage.toLowerCase();

        if (msg.contains("tình trạng") || msg.contains("status")) {
            return Arrays.asList(
                "What are the main reasons for the delays?",
                "How can we improve OEE?",
                "What is the production forecast for tomorrow?"
            );
        }

        if (msg.contains("chậm") || msg.contains("delay")) {
            return Arrays.asList(
                "Which production line is most affected?",
                "What immediate actions should we take?",
                "What is the root cause of the delay?"
            );
        }

        if (msg.contains("oee") || msg.contains("hiệu suất")) {
            return Arrays.asList(
                "How does OEE compare with last month?",
                "Which factors impact OEE the most?",
                "What is a realistic OEE target?"
            );
        }

        return getDefaultQuestions();
    }

    private List<String> getDefaultQuestions() {
        return Arrays.asList(
            "What is the current production status?",
            "Analyze the reasons for production delays",
            "Recommend actions to improve OEE",
            "Give a high-level production summary for today"
        );
    }


    private AIChatResponse getErrorResponse(String sessionId) {
        return AIChatResponse.builder()
            .response("Sorry, I cannot access production data right now. Please try again later.")
            .sessionId(sessionId)
            .timestamp(LocalDateTime.now())
            .success(false)
            .suggestedQuestions(getDefaultQuestions())
            .responseType("TEXT")
            .build();
    }
}
