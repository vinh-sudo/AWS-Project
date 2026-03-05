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
}