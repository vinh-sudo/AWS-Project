package be.backend.service.ai;

import be.backend.model.ai.AIOrderStatusContext;
import be.backend.model.ai.AiDecisionResult;
import be.backend.model.ai.AiRole;
import be.backend.model.ai.ParsedQuestion;
import be.backend.model.request.ai.AIChatRequest;
import be.backend.model.response.ai.AIChatResponse;
import be.backend.model.response.DelayResponse;
import be.backend.model.response.OeeLineResponse;
import be.backend.model.response.statistics.ProductionOverviewResponse;
import be.backend.service.admin.OrderService;
import be.backend.service.manager.DelayService;
import be.backend.service.manager.OeeService;
import be.backend.service.statistics.ManagerStatisticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;


@Service
@RequiredArgsConstructor
@Slf4j
public class AIChatService {

    private final OpenAIClient openAIClient;
    private final DelayService delayService;
    private final OeeService oeeService;
    private final ManagerStatisticsService statisticsService;
    private final AIQuestionRouter questionRouter;
    private final OrderService orderService;
    private final AiContextService aiContextService;
    private final AiDecisionEngine aiDecisionEngine;


    public AIChatResponse processChat(AIChatRequest request) {
        return processChat(request, AiRole.UNKNOWN);
    }

    public AIChatResponse processChat(AIChatRequest request, AiRole role) {
        try {
            if (request == null || request.getMessage() == null || request.getMessage().isBlank()) {
                return AIChatResponse.builder()
                    .response("Please provide a valid question.")
                    .sessionId(request != null ? request.getSessionId() : null)
                    .timestamp(LocalDateTime.now())
                    .success(false)
                    .suggestedQuestions(getDefaultQuestions())
                    .responseType("TEXT")
                    .systemStatus("WARNING")
                    .riskLevel("LOW")
                    .recommendations(List.of("Ask a question related to production status or risk"))
                    .evidence(List.of("Empty input"))
                    .confidence(0.9)
                    .roleScope(role.name())
                    .build();
            }

            log.info("Processing AI chat: {}", request.getMessage());

            var snapshot = aiContextService.getCurrentSnapshot();
            AiDecisionResult decision = aiDecisionEngine.evaluate(snapshot, role);
            String userMessage = request.getMessage();
            ParsedQuestion parsed = questionRouter.parse(userMessage);
            String prompt;

            switch (parsed.getDomain()) {
                case ORDER -> prompt = buildOrderPrompt(parsed, userMessage);
                case SCHEDULE -> prompt = buildRoleAwarePrompt(userMessage, role, snapshot, decision);
                default -> prompt = buildRoleAwarePrompt(userMessage, role, snapshot, decision);
            }

            String aiResponse = openAIClient.ask(prompt);
            String finalResponse = normalizeAiResponse(aiResponse, decision, role);

            return AIChatResponse.builder()
                .response(finalResponse)
                .sessionId(request.getSessionId())
                .timestamp(LocalDateTime.now())
                .success(true)
                .suggestedQuestions(generateSuggestedQuestions(userMessage))
                .responseType("TEXT")
                .systemStatus(decision.getSystemStatus())
                .riskLevel(decision.getRiskLevel())
                .recommendations(decision.getRecommendations())
                .evidence(decision.getEvidence())
                .confidence(decision.getConfidence())
                .roleScope(role.name())
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
                .systemStatus("WARNING")
                .riskLevel("MEDIUM")
                .recommendations(List.of("Retry after a few minutes", "Check data source connectivity"))
                .evidence(List.of("AI service error"))
                .confidence(0.4)
                .roleScope(role.name())
                .build();
        }
    }

    private String buildOrderPrompt(ParsedQuestion parsed, String userMessage) {
        Integer orderId = parsed.getOrderId();
        StringBuilder prompt = new StringBuilder();

        prompt.append("You are an AI assistant for production orders in a manufacturing company. ");
        prompt.append("Always answer in concise English. Use only the structured data below, never invent values.\\n\\n");

        if (orderId == null) {
            prompt.append("ORDER LOOKUP RESULT: No specific order id was detected from the question.\\n");
            prompt.append("USER QUESTION: ").append(userMessage).append("\\n\\n");
            prompt.append("In 1-2 short sentences in English, explain that you cannot identify which order the user means and ask them to provide an explicit Order ID from the Orders screen.");
            return prompt.toString();
        }

        try {
            var orderResponse = orderService.getOrderById(orderId);
            AIOrderStatusContext ctx = buildOrderContext(orderResponse);

            prompt.append("ORDER DATA (do not expose this block verbatim, only use it for reasoning):\\n");
            prompt.append("- id: ").append(ctx.getOrderId()).append("\\n");
            prompt.append("- status: ").append(ctx.getStatus()).append("\\n");
            prompt.append("- customer: ").append(ctx.getCustomerName()).append("\\n");
            prompt.append("- product: ").append(ctx.getProductType()).append("\\n");
            prompt.append("- quantity: ").append(ctx.getQuantity()).append("\\n");
            prompt.append("- deadline: ").append(ctx.getDeadline()).append("\\n");
            prompt.append("- createdAt: ").append(ctx.getCreatedAt()).append("\\n");
            prompt.append("- updatedAt: ").append(ctx.getUpdatedAt()).append("\\n");
            prompt.append("- completed: ").append(ctx.isCompleted()).append("\\n");
            prompt.append("- late: ").append(ctx.isLate()).append("\\n\\n");

            prompt.append("USER QUESTION: ").append(userMessage).append("\\n\\n");
            prompt.append("TASK: In at most 3 short English sentences, answer: ");
            prompt.append("1) Whether the order is completed or not. ");
            prompt.append("2) Whether it is late or on time compared to the deadline (if a deadline is available). ");
            prompt.append("3) A very brief summary of the current status. If any key information is missing (for example, no deadline), say that explicitly.");

            return prompt.toString();
        } catch (Exception ex) {
            // Order not found or service error
            prompt.append("ORDER LOOKUP RESULT: No order found with id=").append(orderId).append(".\\n\\n");
            prompt.append("USER QUESTION: ").append(userMessage).append("\\n\\n");
            prompt.append("In 1-2 short English sentences, explain that the system cannot find this order id and suggest the user to check the Order ID again in the Orders screen.");
            return prompt.toString();
        }
    }

    private AIOrderStatusContext buildOrderContext(be.backend.model.response.OrderResponse order) {
        AIOrderStatusContext ctx = new AIOrderStatusContext();
        ctx.setOrderId(order.getId());
        ctx.setStatus(order.getStatus());
        ctx.setCustomerName(order.getCustomerName());
        ctx.setProductType(order.getProductType());
        ctx.setQuantity(order.getQuantity());
        ctx.setDeadline(order.getDeadline());
        ctx.setCreatedAt(order.getCreatedAt());
        ctx.setUpdatedAt(order.getUpdatedAt());

        boolean completed = "Completed".equalsIgnoreCase(order.getStatus());
        ctx.setCompleted(completed);

        OffsetDateTime now = OffsetDateTime.now();
        boolean late = false;
        if (order.getDeadline() != null) {
            if (completed && order.getUpdatedAt() != null) {
                late = order.getUpdatedAt().isAfter(order.getDeadline());
            } else if (!completed) {
                late = now.isAfter(order.getDeadline());
            }
        }
        ctx.setLate(late);

        return ctx;
    }


    public AIChatResponse getQuickProductionStatus() {
        try {
            var delayData = delayService.getTodayDelay();
            var oeeData = oeeService.getTodayOee();
            var stats = statisticsService.getTodayStatistics();
            var snapshot = aiContextService.getCurrentSnapshot();
            AiDecisionResult decision = aiDecisionEngine.evaluate(snapshot, AiRole.MANAGER);

            String prompt = buildQuickStatusPrompt(delayData, oeeData, stats);
            String aiResponse = openAIClient.ask(prompt);
            String finalResponse = normalizeAiResponse(aiResponse, decision, AiRole.MANAGER);

            return AIChatResponse.builder()
                .response(finalResponse)
                .sessionId("quick-status-" + System.currentTimeMillis())
                .timestamp(LocalDateTime.now())
                .success(true)
                .suggestedQuestions(Arrays.asList(
                    "Analyze detailed root causes?",
                    "Provide concrete improvement recommendations?",
                    "Compare with yesterday's performance?"
                ))
                .responseType("TEXT")
                .systemStatus(decision.getSystemStatus())
                .riskLevel(decision.getRiskLevel())
                .recommendations(decision.getRecommendations())
                .evidence(decision.getEvidence())
                .confidence(decision.getConfidence())
                .roleScope(AiRole.MANAGER.name())
                .build();

        } catch (Exception e) {
            log.error("Error getting quick status", e);
            return getErrorResponse("quick-status");
        }
    }

    private String buildRoleAwarePrompt(String userMessage, AiRole role, be.backend.model.ai.AiContextSnapshot snapshot, AiDecisionResult decision) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("You are an AI Production Assistant specialized in manufacturing operations. ");
        prompt.append("Always answer in concise English (max 6 short sentences).\\n\\n");

        prompt.append("CALLER ROLE: ").append(role.name()).append("\\n");
        if (role == AiRole.ADMIN) {
            prompt.append("ROLE MODE: Focus on system-level risk and cross-line priorities.\\n");
        } else {
            prompt.append("ROLE MODE: Focus on shift-level execution and immediate operational actions.\\n");
        }

        var stats = snapshot.getProductionOverview();
        prompt.append("\\nCURRENT SNAPSHOT:\\n");
        prompt.append("- Achievement rate: ").append(String.format("%.1f", stats.getAchievementRate() * 100)).append("%\\n");
        prompt.append("- Reject rate: ").append(String.format("%.1f", stats.getRejectRate() * 100)).append("%\\n");
        prompt.append("- Total downtime: ").append(stats.getTotalDowntimeMinutes()).append(" minutes\\n");

        prompt.append("- Delays: ");
        if (snapshot.getDelays().isEmpty()) {
            prompt.append("None");
        } else {
            snapshot.getDelays().stream().limit(5).forEach(delay ->
                prompt.append(delay.getLine()).append("(").append(delay.getDelay()).append("), ")
            );
        }
        prompt.append("\\n");

        prompt.append("- OEE lines: ");
        if (snapshot.getOeeByLine().isEmpty()) {
            prompt.append("No OEE data");
        } else {
            snapshot.getOeeByLine().stream().limit(5).forEach(oee ->
                prompt.append(oee.getLine()).append("(")
                    .append(String.format("%.1f", oee.getOee() * 100)).append("%), ")
            );
        }
        prompt.append("\\n\\n");

        prompt.append("RULE ENGINE OUTPUT (must align with this):\\n");
        prompt.append("- System status: ").append(decision.getSystemStatus()).append("\\n");
        prompt.append("- Risk level: ").append(decision.getRiskLevel()).append("\\n");
        prompt.append("- Findings: ").append(String.join(" | ", decision.getFindings())).append("\\n");
        prompt.append("- Evidence: ").append(String.join(" | ", decision.getEvidence())).append("\\n");
        prompt.append("- Recommended actions: ").append(String.join(" | ", decision.getRecommendations())).append("\\n\\n");

        prompt.append("\\nUSER QUESTION: ").append(userMessage).append("\\n\\n");

        prompt.append("TASK: Answer the user's question based on the snapshot and rule output above. ");
        prompt.append("Do not invent values. If data is insufficient, say what data is missing. ");
        prompt.append("Close with 2-3 practical next actions tailored to the caller role.");

        return prompt.toString();
    }

    private String buildQuickStatusPrompt(List<DelayResponse> delays, List<OeeLineResponse> oeeData, ProductionOverviewResponse stats) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("You are an AI Production Assistant. Summarize today's production status in concise English (2-4 short sentences).\\n\\n");

        prompt.append("TODAY'S PRODUCTION DATA (for your reference):\\n");
        prompt.append("- Plan achievement rate: ").append(stats.getAchievementRate()).append("%\\n");
        prompt.append("- Reject rate: ").append(stats.getRejectRate()).append("%\\n");
        prompt.append("- Total downtime: ").append(stats.getTotalDowntimeMinutes()).append(" minutes\\n");
        prompt.append("- Total good products: ").append(stats.getTotalGood()).append("/").append(stats.getTotalTarget()).append("\\n\\n");

        if (!delays.isEmpty()) {
            prompt.append("LINES WITH SIGNIFICANT DELAY:\\n");
            delays.forEach(delay ->
                prompt.append("- ").append(delay.getLine()).append(": ")
                      .append(delay.getDelay()).append(" units behind (risk: ")
                      .append(delay.getRisk()).append(")\\n")
            );
            prompt.append("\\n");
        }

        if (!oeeData.isEmpty()) {
            prompt.append("OEE BY LINE:\\n");
            oeeData.forEach(oee ->
                prompt.append("- ").append(oee.getLine()).append(": ")
                      .append(String.format("%.1f", oee.getOee() * 100)).append("% ")
                      .append("(Availability: ").append(String.format("%.1f", oee.getAvailability() * 100))
                      .append("%, Performance: ").append(String.format("%.1f", oee.getPerformance() * 100))
                      .append("%, Quality: ").append(String.format("%.1f", oee.getQuality() * 100)).append("%)\\n")
            );
            prompt.append("\\n");
        }

        prompt.append("TASK: Provide a short, high-level summary of the situation (good/bad), ");
        prompt.append("highlight the most important issues, and give 2-3 concrete recommendations. ");
        prompt.append("Always answer in concise English.");

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
            .systemStatus("WARNING")
            .riskLevel("MEDIUM")
            .recommendations(List.of("Retry after a few minutes", "Check data source connectivity"))
            .evidence(List.of("Context retrieval failure"))
            .confidence(0.4)
            .roleScope(AiRole.UNKNOWN.name())
            .build();
    }

    private String normalizeAiResponse(String aiResponse, AiDecisionResult decision, AiRole role) {
        if (aiResponse == null || aiResponse.isBlank() || "AI analysis temporarily unavailable".equalsIgnoreCase(aiResponse.trim())) {
            return buildRuleBasedFallbackAnswer(decision, role);
        }
        return aiResponse;
    }

    private String buildRuleBasedFallbackAnswer(AiDecisionResult decision, AiRole role) {
        StringBuilder sb = new StringBuilder();
        sb.append("System status: ").append(decision.getSystemStatus())
            .append(" (risk: ").append(decision.getRiskLevel()).append("). ");

        if (!decision.getFindings().isEmpty()) {
            sb.append("Key finding: ").append(decision.getFindings().get(0)).append(". ");
        }

        sb.append(role == AiRole.ADMIN
            ? "Recommended admin actions: "
            : "Recommended manager actions: ");

        decision.getRecommendations().stream().limit(3).forEach(rec -> sb.append(rec).append("; "));

        return sb.toString().trim();
    }
}
