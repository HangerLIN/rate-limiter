package com.example.redistratelimiter;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
public class RedisLeakyBucketLimiter {
    private final RedisTemplate<String, Object> redisTemplate;
    private static final String KEY_PREFIX = "rate_limit:leaky:";
    private static final long CAPACITY = 10;
    private static final long RATE = 5; // 每秒5个请求

    public RedisLeakyBucketLimiter(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public boolean tryAcquire(String key) {
        String redisKey = KEY_PREFIX + key;
        String waterKey = redisKey + ":water";
        String lastLeakTimeKey = redisKey + ":lastLeakTime";
        
        // 获取当前水量
        Long water = (Long) redisTemplate.opsForValue().get(waterKey);
        if (water == null) {
            water = 0L;
        }
        
        // 获取上次漏水时间
        Long lastLeakTime = (Long) redisTemplate.opsForValue().get(lastLeakTimeKey);
        if (lastLeakTime == null) {
            lastLeakTime = System.currentTimeMillis();
            redisTemplate.opsForValue().set(lastLeakTimeKey, lastLeakTime);
        }
        
        // 计算漏水量
        long currentTime = System.currentTimeMillis();
        long leakWater = (currentTime - lastLeakTime) * RATE / 1000;
        water = Math.max(water - leakWater, 0);
        
        // 更新水量和最后漏水时间
        redisTemplate.opsForValue().set(waterKey, water);
        redisTemplate.opsForValue().set(lastLeakTimeKey, currentTime);
        
        // 设置过期时间
        redisTemplate.expire(waterKey, 1, TimeUnit.SECONDS);
        redisTemplate.expire(lastLeakTimeKey, 1, TimeUnit.SECONDS);
        
        // 判断是否可以加水
        if (water < CAPACITY) {
            redisTemplate.opsForValue().increment(waterKey);
            return true;
        }
        
        return false;
    }
} 