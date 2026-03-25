package be.backend.configuration;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@Slf4j
public class AiRateLimitInterceptor implements HandlerInterceptor {

    private static final class CounterWindow {
        private volatile long windowBucket;
        private final AtomicInteger counter = new AtomicInteger(0);

        CounterWindow(long windowBucket) {
            this.windowBucket = windowBucket;
        }
    }

    private final AiApiSecurityProperties properties;
    private final RedisTemplate<String, String> redisTemplate;
    private final Map<String, CounterWindow> fallbackWindows = new ConcurrentHashMap<>();

    public AiRateLimitInterceptor(AiApiSecurityProperties properties, RedisTemplate<String, String> redisTemplate) {
        this.properties = properties;
        this.redisTemplate = redisTemplate;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (!properties.getRateLimit().isEnabled()) {
            return true;
        }

        int limit = Math.max(1, properties.getRateLimit().getLimitPerMinute());
        int windowSeconds = Math.max(1, properties.getRateLimit().getWindowSeconds());
        long bucket = System.currentTimeMillis() / (windowSeconds * 1000L);
        String key = buildRateLimitKey(request);
        String redisKey = properties.getRateLimit().getKeyPrefix() + ":" + bucket + ":" + key;

        long current;
        try {
            Long count = redisTemplate.opsForValue().increment(redisKey);
            if (count == null) {
                current = resolveFallbackCount(key, bucket);
            } else {
                current = count;
                if (count == 1L) {
                    redisTemplate.expire(redisKey, Duration.ofSeconds(windowSeconds + 5L));
                }
            }
        } catch (Exception ex) {
            // Keep throttling active with local fallback when Redis is unavailable.
            log.warn("AI rate-limit Redis unavailable, using local fallback for key={}", key, ex);
            current = resolveFallbackCount(key, bucket);
        }

        int remaining = (int) Math.max(0, limit - current);
        response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(remaining));

        if (current > limit) {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            writeRateLimitBody(response);
            return false;
        }

        return true;
    }

    private String buildRateLimitKey(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getName() != null && !authentication.getName().isBlank()) {
            return "user:" + authentication.getName();
        }
        return "ip:" + request.getRemoteAddr();
    }

    private void writeRateLimitBody(HttpServletResponse response) throws IOException {
        response.getWriter().write("{\"error\":\"Too many AI requests. Please try again later.\"}");
    }

    private long resolveFallbackCount(String key, long bucket) {
        CounterWindow window = fallbackWindows.computeIfAbsent(key, k -> new CounterWindow(bucket));
        synchronized (window) {
            if (window.windowBucket != bucket) {
                window.windowBucket = bucket;
                window.counter.set(0);
            }
            return window.counter.incrementAndGet();
        }
    }
}
