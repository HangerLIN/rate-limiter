package com.example.ratelimiter;

public class FixedWindowLimiter {
    /**
     * 每秒限制请求数
     */
    private static final long perSecondLimit = 2;
    /**
     * 上一个窗口的开始时间
     */
    public static long preStartTime = System.currentTimeMillis();
    /**
     * 计数器
     */
    private static int counter;
 
    public static synchronized boolean tryAcquire() {
        long now = System.currentTimeMillis();
        // 假设窗口时间位1秒，在窗口期内判断计数器是否超过限制的请求数
        if (now - preStartTime < 1000) {
        	// 计数器小于限制数时放行，否则拒绝请求
            if (counter < perSecondLimit) {
                counter++;
                return true;
            } else {
                return false;
            }
        }
        // 时间窗口过期，重置计数器和时间戳
        counter = 0;
        preStartTime = now;
        return true;
    }
} 