package com.example.ratelimiter;

import java.util.concurrent.TimeUnit;

public class TokenBucketLimiter {
    /**
     * 桶的最大容量
     */
    public long capacity = 10;
    /**
     * 桶内当前的令牌数量
     */
    public long count = 0;
    /**
     * 令牌生成速率（每秒5次）
     */
    public long tokenRate = 5;
    /**
     * 上次生成令牌的时间
     */
    public long lastGenerateTime = System.currentTimeMillis();
 
    /**
     * 限流方法，返回true表示通过
     */
    public boolean limit() {
        // 调用生成令牌方法
        this.generateTokens();
        // 判断桶内是否还有令牌
        if (count > 0) {
            count--;
            return true;
        }
        return false;
    }
 
    /**
     * 生成令牌方法，计算并更新这段时间内生成的令牌数量
     */
    private void generateTokens() {
        long currentTime = System.currentTimeMillis();
        // 计算这段时间内，需要生成的令牌数量
        long tokens = (currentTime - lastGenerateTime) * tokenRate / 1000;
        count = Math.min(count + tokens, capacity);
        lastGenerateTime = currentTime;
    }
 
    public static void main(String[] args) throws InterruptedException {
        TokenBucketLimiter limiter = new TokenBucketLimiter();
        TimeUnit.MILLISECONDS.sleep(1000);// 生成5个令牌
        limiter.generateTokens();
        for (int i = 0; i < 20; i++) {
            if (limiter.limit()){
                System.out.println("任务" + (i + 1)  + "执行任务 ");
            }else{
                System.out.println("任务" + (i + 1)  + "被限流 ");
            }
        }
    }
} 