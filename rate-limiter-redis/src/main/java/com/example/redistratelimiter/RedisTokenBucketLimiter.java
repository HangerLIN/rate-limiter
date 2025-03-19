package com.example.redistratelimiter;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
public class RedisTokenBucketLimiter {
    private final RedisTemplate<String, Object> redisTemplate;
    private static final String KEY_PREFIX = "rate_limit:token:";
    private static final long CAPACITY = 10;
    private static final long TOKEN_RATE = 5; // 每秒5个令牌

    public RedisTokenBucketLimiter(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public boolean tryAcquire(String key) {
        String redisKey = KEY_PREFIX + key;
        String tokenKey = redisKey + ":tokens";
        String lastGenerateTimeKey = redisKey + ":lastGenerateTime";
        
        // 获取当前令牌数
        Long tokens = (Long) redisTemplate.opsForValue().get(tokenKey);
        if (tokens == null) {
            tokens = 0L;
        }
        
        // 获取上次生成令牌时间
        Long lastGenerateTime = (Long) redisTemplate.opsForValue().get(lastGenerateTimeKey);
        if (lastGenerateTime == null) {
            lastGenerateTime = System.currentTimeMillis();
            redisTemplate.opsForValue().set(lastGenerateTimeKey, lastGenerateTime);
        }
        
        // 生成新令牌
        long currentTime = System.currentTimeMillis();
        long newTokens = (currentTime - lastGenerateTime) * TOKEN_RATE / 1000;
        tokens = Math.min(tokens + newTokens, CAPACITY);
        
        // 更新令牌数和最后生成时间
        redisTemplate.opsForValue().set(tokenKey, tokens);
        redisTemplate.opsForValue().set(lastGenerateTimeKey, currentTime);
        
        // 设置过期时间
        redisTemplate.expire(tokenKey, 1, TimeUnit.SECONDS);
        redisTemplate.expire(lastGenerateTimeKey, 1, TimeUnit.SECONDS);
        
        // 判断是否有令牌可用
        if (tokens > 0) {
            redisTemplate.opsForValue().decrement(tokenKey);
            return true;
        }
        
        return false;
    }
} 