package be.backend.service.ai;

import be.backend.configuration.OpenAIProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class OpenAIClient {

    private final OpenAIProperties properties;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String ask(String prompt) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + properties.getApiKey());
            headers.set("Content-Type", "application/json");

            Map<String, Object> requestBody = Map.of(
                "model", properties.getModel(),
                "messages", new Object[]{
                    Map.of("role", "user", "content", prompt)
                },
                "max_tokens", properties.getMaxTokens(),
                "temperature", properties.getTemperature()
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                properties.getUrl(),
                HttpMethod.POST,
                entity,
                String.class
            );

            // Parse response to get content
            JsonNode responseJson = objectMapper.readTree(response.getBody());
            return responseJson
                .path("choices")
                .get(0)
                .path("message")
                .path("content")
                .asText();

        } catch (Exception e) {
            log.error("Error calling OpenAI API", e);
            return "AI analysis temporarily unavailable";
        }
    }
}
