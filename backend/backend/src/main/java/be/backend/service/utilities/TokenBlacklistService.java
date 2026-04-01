package be.backend.service.utilities;

import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenBlacklistService {
    private final RedisTemplate<String,String> redisTemplate;
    private static final String BLACKLIST_PREFIX = "blacklist:";

    /**
     * Thêm token vào blacklist
     * @param token - JWT token cần blacklist
     * @param expirationInSeconds - Thời gian token còn valid (để auto-remove khỏi Redis)
     */
    public void blacklistToken(String token, Long expirationInSeconds){
        String key = BLACKLIST_PREFIX + token;
        try {
            redisTemplate.opsForValue().set(key, "blacklisted", expirationInSeconds, TimeUnit.SECONDS);
            log.info("Token blacklisted, will expire in {} seconds", expirationInSeconds);
        } catch (Exception e) {
            log.warn("[Redis] Failed to blacklist token, fallback to no blacklist. token={} error={}", token, e.getMessage());
        }
    }

    /**
     * Kiểm tra token có bị blacklist không
     * @param token - JWT token cần check
     * @return true nếu token bị blacklist
     */
    public boolean isBlacklisted(String token){
        String key = BLACKLIST_PREFIX + token;
        try {
            boolean exists = redisTemplate.hasKey(key);
            return Boolean.TRUE.equals(exists);
        } catch (Exception e) {
            log.warn("[Redis] Failed to check blacklist, fallback to allow. token={} error={}", token, e.getMessage());
            return false;
        }
    }

    public void removeFromBlacklist(String token){
        String key = BLACKLIST_PREFIX + token;
        try {
            redisTemplate.delete(key);
            log.info("Token removed from blacklist");
        } catch (Exception e) {
            log.warn("[Redis] Failed to remove token from blacklist, token={} error={}", token, e.getMessage());
        }
    }
}
