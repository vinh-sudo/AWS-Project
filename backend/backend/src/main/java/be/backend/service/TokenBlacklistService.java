package be.backend.service;

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
        // Lưu vào Redis với TTL = thời gian còn lại của token
        // Sau khi token hết hạn, Redis tự động xóa (tiết kiệm memory)
        redisTemplate.opsForValue().set(key, "blacklisted", expirationInSeconds, TimeUnit.SECONDS);
        log.info("Token blacklisted, will expire in {} seconds", expirationInSeconds);
    }

    /**
     * Kiểm tra token có bị blacklist không
     * @param token - JWT token cần check
     * @return true nếu token bị blacklist
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
