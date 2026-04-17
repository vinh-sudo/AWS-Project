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
    * Add a token to the blacklist
    * @param token JWT token to blacklist
    * @param expirationInSeconds Remaining token validity in seconds (for auto-removal from Redis)
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
    * Check whether a token is blacklisted
    * @param token JWT token to check
    * @return true if the token is blacklisted
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
