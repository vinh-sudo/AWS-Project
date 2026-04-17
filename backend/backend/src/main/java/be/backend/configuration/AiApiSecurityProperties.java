package be.backend.configuration;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "ai.api")
public class AiApiSecurityProperties {

    private RateLimit rateLimit = new RateLimit();

    @Getter
    @Setter
    public static class RateLimit {
        private boolean enabled = true;
        private int limitPerMinute = 60;
        private String keyPrefix = "ai:rate-limit";
        private int windowSeconds = 60;
    }
}
