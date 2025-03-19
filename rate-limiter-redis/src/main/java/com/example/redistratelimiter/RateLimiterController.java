package com.example.redistratelimiter;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RateLimiterController {
    private final RedisFixedWindowLimiter fixedWindowLimiter;
    private final RedisSlidingWindowLimiter slidingWindowLimiter;
    private final RedisLeakyBucketLimiter leakyBucketLimiter;
    private final RedisTokenBucketLimiter tokenBucketLimiter;

    public RateLimiterController(
            RedisFixedWindowLimiter fixedWindowLimiter,
            RedisSlidingWindowLimiter slidingWindowLimiter,
            RedisLeakyBucketLimiter leakyBucketLimiter,
            RedisTokenBucketLimiter tokenBucketLimiter) {
        this.fixedWindowLimiter = fixedWindowLimiter;
        this.slidingWindowLimiter = slidingWindowLimiter;
        this.leakyBucketLimiter = leakyBucketLimiter;
        this.tokenBucketLimiter = tokenBucketLimiter;
    }

    @GetMapping("/fixed")
    public String fixedWindow(String key) {
        return fixedWindowLimiter.tryAcquire(key) ? "true" : "false";
    }

    @GetMapping("/sliding")
    public String slidingWindow(String key) {
        return slidingWindowLimiter.tryAcquire(key) ? "true" : "false";
    }

    @GetMapping("/leaky")
    public String leakyBucket(String key) {
        return leakyBucketLimiter.tryAcquire(key) ? "true" : "false";
    }

    @GetMapping("/token")
    public String tokenBucket(String key) {
        return tokenBucketLimiter.tryAcquire(key) ? "true" : "false";
    }
} 