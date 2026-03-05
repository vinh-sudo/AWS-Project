package be.backend.controller.AI;

import be.backend.model.request.ai.AIChatRequest;
import be.backend.model.response.ai.AIChatResponse;
import be.backend.service.ai.AIChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * AI Chat Controller - Interactive AI Assistant
 * Provides conversational AI interface for production queries
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIChatController {

    private final AIChatService aiChatService;

    /**
     * 💬 AI Chat Endpoint - Interactive conversation
     * User can ask questions and get intelligent responses
     *
     * Examples:
     * - "Tình trạng sản xuất hiện tại như thế nào?"
     * - "Tại sao Line A bị chậm?"
     * - "Làm thế nào để cải thiện OEE?"
     */
    @PostMapping("/chat")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('LEADER')")
    public AIChatResponse chat(@RequestBody AIChatRequest request) {
        return aiChatService.processChat(request);
    }

    /**
     * 📊 Quick Production Status Query
     * Pre-built query for quick status check
     */
    @GetMapping("/quick-status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('LEADER')")
    public AIChatResponse getQuickStatus() {
        return aiChatService.getQuickProductionStatus();
    }
}
