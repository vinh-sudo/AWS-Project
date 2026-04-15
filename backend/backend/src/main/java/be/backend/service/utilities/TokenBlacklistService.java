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
        // Store in Redis with TTL equal to the remaining token lifetime
        // After the token expires, Redis removes it automatically to save memory
        redisTemplate.opsForValue().set(key, "blacklisted", expirationInSeconds, TimeUnit.SECONDS);
        log.info("Token blacklisted, will expire in {} seconds", expirationInSeconds);
    }

    /**
    * Check whether a token is blacklisted
    * @param token JWT token to check
    * @return true if the token is blacklisted
     */
    public boolean isBlacklisted(String token){
        String key = BLACKLIST_PREFIX + token;
        boolean exists = redisTemplate.hasKey(key);
        return Boolean.TRUE.equals(exists);
    }

    public void removeFromBlacklist(String token){
        String key = BLACKLIST_PREFIX + token;
        redisTemplate.delete(key);
        log.info("Token removed from blacklist");
    }
}
