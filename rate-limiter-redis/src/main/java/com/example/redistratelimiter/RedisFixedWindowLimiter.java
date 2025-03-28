package com.example.redistratelimiter;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
public class RedisFixedWindowLimiter {
    private final RedisTemplate<String, Object> redisTemplate;
    private static final String KEY_PREFIX = "rate_limit:fixed:";
    private static final long PER_SECOND_LIMIT = 2;
    private static final long WINDOW_SIZE = 1;

    public RedisFixedWindowLimiter(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public boolean tryAcquire(String key) {
        String redisKey = KEY_PREFIX + key;
        Long count = redisTemplate.opsForValue().increment(redisKey);
        if (count == 1) {
            redisTemplate.expire(redisKey, WINDOW_SIZE, TimeUnit.SECONDS);
        }
        return count <= PER_SECOND_LIMIT;
    }
} 