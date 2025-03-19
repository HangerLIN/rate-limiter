package com.example.redistratelimiter;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
public class RedisSlidingWindowLimiter {
    private final RedisTemplate<String, Object> redisTemplate;
    private static final String KEY_PREFIX = "rate_limit:sliding:";
    private static final long WINDOW_SIZE = 1000; // 1秒
    private static final int WINDOW_NUM = 10; // 10个子窗口
    private static final int MAX_REQUEST_COUNT = 10; // 最大请求数

    public RedisSlidingWindowLimiter(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public boolean tryAcquire(String key) {
        String redisKey = KEY_PREFIX + key;
        long currentTime = System.currentTimeMillis();
        long windowStart = currentTime - WINDOW_SIZE;
        
        // 删除过期的子窗口
        redisTemplate.opsForZSet().removeRangeByScore(redisKey, 0, windowStart);
        
        // 获取当前窗口内的请求数
        Long count = redisTemplate.opsForZSet().count(redisKey, windowStart, currentTime);
        
        if (count == null || count < MAX_REQUEST_COUNT) {
            // 添加当前请求
            redisTemplate.opsForZSet().add(redisKey, currentTime, currentTime);
            // 设置过期时间
            redisTemplate.expire(redisKey, WINDOW_SIZE / 1000, TimeUnit.SECONDS);
            return true;
        }
        
        return false;
    }
} 