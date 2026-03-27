package be.backend.controller.ai;

import be.backend.model.ai.AiContextSnapshot;
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

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.setup.MockMvcBuilders.webAppContextSetup;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
    "ai.api.rate-limit.limit-per-minute=100",
    "spring.datasource.url=jdbc:h2:mem:ai-test-security;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
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
class AIChatControllerSecurityIntegrationTest {

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
        when(aiChatService.getQuickProductionStatus()).thenReturn(response);
        when(aiContextService.getCurrentSnapshot()).thenReturn(
            AiContextSnapshot.builder()
                .snapshotTime(LocalDateTime.now())
                .delays(List.of())
                .oeeByLine(List.of())
                .build()
        );
    }

    @Test
    @WithMockUser(username = "admin1", roles = {"ADMIN"})
    void chat_shouldAllowAdmin() throws Exception {
        AIChatRequest req = new AIChatRequest("status now", "s1", "u1");
        mockMvc.perform(post("/api/ai/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.response").value("ok"));
    }

    @Test
    @WithMockUser(username = "manager1", roles = {"MANAGER"})
    void chat_shouldAllowManager() throws Exception {
        AIChatRequest req = new AIChatRequest("status now", "s1", "u1");
        mockMvc.perform(post("/api/ai/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "leader1", roles = {"LEADER"})
    void chat_shouldRejectLeader() throws Exception {
        AIChatRequest req = new AIChatRequest("status now", "s1", "u1");
        mockMvc.perform(post("/api/ai/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isForbidden());
    }

    @Test
    void chat_shouldRequireAuthentication() throws Exception {
        AIChatRequest req = new AIChatRequest("status now", "s1", "u1");
        mockMvc.perform(post("/api/ai/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin2", roles = {"ADMIN"})
    void quickStatus_shouldAllowAdmin() throws Exception {
        mockMvc.perform(get("/api/ai/quick-status"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.response").value("ok"));
    }

    @Test
    @WithMockUser(username = "manager2", roles = {"MANAGER"})
    void quickStatus_shouldAllowManager() throws Exception {
        mockMvc.perform(get("/api/ai/quick-status"))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "leader2", roles = {"LEADER"})
    void quickStatus_shouldRejectLeader() throws Exception {
        mockMvc.perform(get("/api/ai/quick-status"))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin3", roles = {"ADMIN"})
    void snapshot_shouldAllowAdmin() throws Exception {
        mockMvc.perform(get("/api/ai/context/snapshot"))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "manager3", roles = {"MANAGER"})
    void snapshot_shouldAllowManager() throws Exception {
        mockMvc.perform(get("/api/ai/context/snapshot"))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "leader3", roles = {"LEADER"})
    void snapshot_shouldRejectLeader() throws Exception {
        mockMvc.perform(get("/api/ai/context/snapshot"))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin4", roles = {"ADMIN"})
    void chat_shouldRejectBlankMessage() throws Exception {
        AIChatRequest req = new AIChatRequest("", "s1", "u1");
        mockMvc.perform(post("/api/ai/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "admin5", roles = {"ADMIN"})
    void chat_shouldRejectOversizedMessage() throws Exception {
        String large = "x".repeat(2001);
        AIChatRequest req = new AIChatRequest(large, "s1", "u1");
        mockMvc.perform(post("/api/ai/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest());
    }
}
