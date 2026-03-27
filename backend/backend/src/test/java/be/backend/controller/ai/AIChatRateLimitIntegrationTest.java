package be.backend.controller.ai;

import be.backend.model.request.ai.AIChatRequest;
import be.backend.model.response.ai.AIChatResponse;
import be.backend.service.ai.AIChatService;
import be.backend.service.ai.AiContextService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup;

@SpringBootTest(properties = {
    "ai.api.rate-limit.limit-per-minute=2",
    "spring.datasource.url=jdbc:h2:mem:ai-test-rate;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.flyway.enabled=false",
    "spring.jpa.hibernate.ddl-auto=none",
    "aws.access-key=test-access-key",
    "aws.secret-key=test-secret-key",
    "aws.region=ap-southeast-1",
    "aws.bucket-name=test-bucket"
})
class AIChatRateLimitIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AIChatService aiChatService;

    @MockitoBean
    private AiContextService aiContextService;

    @BeforeEach
    void setupMocks() {
        mockMvc = webAppContextSetup(context).apply(springSecurity()).build();

        AIChatResponse response = AIChatResponse.builder()
            .response("ok")
            .sessionId("s1")
            .success(true)
            .responseType("TEXT")
            .systemStatus("STABLE")
            .riskLevel("LOW")
            .recommendations(List.of("r1"))
            .evidence(List.of("e1"))
            .confidence(0.9)
            .roleScope("ADMIN")
            .build();

        when(aiChatService.processChat(any(AIChatRequest.class), any())).thenReturn(response);
    }

    @Test
    @WithMockUser(username = "rate-admin", roles = {"ADMIN"})
    void chat_shouldReturn429WhenRateLimitExceeded() throws Exception {
        AIChatRequest req = new AIChatRequest("status", "s1", "u1");
        String body = objectMapper.writeValueAsString(req);

        mockMvc.perform(post("/api/ai/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andExpect(header().string("X-RateLimit-Limit", "2"));

        mockMvc.perform(post("/api/ai/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk());

        mockMvc.perform(post("/api/ai/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isTooManyRequests());
    }
}
