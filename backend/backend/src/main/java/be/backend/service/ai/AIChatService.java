package be.backend.service.ai;

import be.backend.model.ai.AIOrderStatusContext;
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


    public AIChatResponse processChat(AIChatRequest request) {
        try {
            log.info("Processing AI chat: {}", request.getMessage());

            String userMessage = request.getMessage();
            ParsedQuestion parsed = questionRouter.parse(userMessage);
            String prompt;

            switch (parsed.getDomain()) {
                case ORDER -> prompt = buildOrderPrompt(parsed, userMessage);
                case SCHEDULE -> prompt = buildChatPrompt(userMessage); // schedule-specific can be added later
                default -> prompt = buildChatPrompt(userMessage);
            }

            String aiResponse = openAIClient.ask(prompt);

            return AIChatResponse.builder()
                .response(aiResponse)
                .sessionId(request.getSessionId())
                .timestamp(LocalDateTime.now())
                .success(true)
                .suggestedQuestions(generateSuggestedQuestions(userMessage))
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
        prompt.append("Always answer in concise English (2-4 short sentences).\\n\\n");

        // Add current production context
        try {
            var delayData = delayService.getTodayDelay();
            var oeeData = oeeService.getTodayOee();
            var stats = statisticsService.getTodayStatistics();

            prompt.append("CURRENT PRODUCTION DATA (for your reference):\\n");
            prompt.append("- Plan achievement rate: ").append(stats.getAchievementRate()).append("%\\n");
            prompt.append("- Reject rate: ").append(stats.getRejectRate()).append("%\\n");
            prompt.append("- Total downtime: ").append(stats.getTotalDowntimeMinutes()).append(" minutes\\n");

            if (!delayData.isEmpty()) {
                prompt.append("- Delayed lines: ");
                delayData.forEach(delay ->
                    prompt.append(delay.getLine()).append(" (")
                          .append(delay.getDelay()).append(" units behind), ")
                );
                prompt.append("\\n");
            }

            if (!oeeData.isEmpty()) {
                prompt.append("- OEE by line: ");
                oeeData.forEach(oee ->
                    prompt.append(oee.getLine()).append(" (")
                          .append(String.format("%.1f", oee.getOee() * 100)).append("%), ")
                );
                prompt.append("\\n");
            }

        } catch (Exception e) {
            log.warn("Could not load production context", e);
        }

        prompt.append("\\nUSER QUESTION: ").append(userMessage).append("\\n\\n");

        prompt.append("TASK: Answer the user's question using the production data above when relevant. ");
        prompt.append("If the data is not sufficient, say that clearly and suggest what additional information is needed. ");
        prompt.append("Keep the answer brief, clear and practical.");

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
            .build();
    }
}
