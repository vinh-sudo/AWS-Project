package be.backend.configuration;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "ai.openai")
public class OpenAIProperties {

    private String apiKey;
    private String url = "https://api.openai.com/v1/chat/completions";
    private String model = "gpt-3.5-turbo";
    private Integer maxTokens = 500;
    private Double temperature = 0.3;
    private Integer connectTimeoutMs = 5000;
    private Integer readTimeoutMs = 15000;
    private Integer retryCount = 2;
    private Integer retryBackoffMs = 300;
}