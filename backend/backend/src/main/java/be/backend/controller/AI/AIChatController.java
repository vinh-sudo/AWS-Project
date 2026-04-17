package be.backend.controller.AI;

import be.backend.model.ai.AiContextSnapshot;
import be.backend.model.ai.AiRole;
import be.backend.model.request.ai.AIChatRequest;
import be.backend.model.response.ai.AIChatResponse;
import be.backend.service.ai.AIChatService;
import be.backend.service.ai.AiContextService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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
    private final AiContextService aiContextService;


    @PostMapping("/chat")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public AIChatResponse chat(@Valid @RequestBody AIChatRequest request, Authentication authentication) {
        return aiChatService.processChat(request, resolveRole(authentication));
    }


    @GetMapping("/quick-status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public AIChatResponse getQuickStatus() {
        return aiChatService.getQuickProductionStatus();
    }

    @GetMapping("/context/snapshot")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public AiContextSnapshot getContextSnapshot() {
        return aiContextService.getCurrentSnapshot();
    }

    private AiRole resolveRole(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return AiRole.UNKNOWN;
        }

        return authentication.getAuthorities().stream()
            .map(grantedAuthority -> AiRole.fromAuthority(grantedAuthority.getAuthority()))
            .filter(role -> role != AiRole.UNKNOWN)
            .findFirst()
            .orElse(AiRole.UNKNOWN);
    }
}
