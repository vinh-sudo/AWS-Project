package be.backend.service.ai;

import be.backend.configuration.OpenAIProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
@Slf4j
public class OpenAIClient {

    private final OpenAIProperties properties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public OpenAIClient(OpenAIProperties properties) {
        this.properties = properties;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Math.max(1000, properties.getConnectTimeoutMs()));
        requestFactory.setReadTimeout(Math.max(1000, properties.getReadTimeoutMs()));
        this.restTemplate = new RestTemplate(requestFactory);
        this.objectMapper = new ObjectMapper();
    }

    public String ask(String prompt) {
        if (prompt == null || prompt.isBlank()) {
            return "AI analysis temporarily unavailable";
        }

        if (properties.getApiKey() == null || properties.getApiKey().isBlank()) {
            log.error("OpenAI apiKey is missing");
            return "AI analysis temporarily unavailable";
        }

        int maxAttempts = Math.max(1, properties.getRetryCount() + 1);
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
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

                JsonNode responseJson = objectMapper.readTree(response.getBody());
                JsonNode choices = responseJson.path("choices");
                if (choices.isArray() && !choices.isEmpty()) {
                    String content = choices.get(0).path("message").path("content").asText();
                    if (content != null && !content.isBlank()) {
                        return content;
                    }
                }
                log.warn("OpenAI response had empty content");
            } catch (Exception e) {
                if (attempt == maxAttempts) {
                    log.error("Error calling OpenAI API after {} attempts", maxAttempts, e);
                } else {
                    log.warn("OpenAI call failed on attempt {}/{}", attempt, maxAttempts);
                    sleepBackoff(attempt);
                }
            }
        }

        return "AI analysis temporarily unavailable";
    }

    private void sleepBackoff(int attempt) {
        long backoff = (long) Math.max(100, properties.getRetryBackoffMs()) * attempt;
        try {
            Thread.sleep(backoff);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }
}
