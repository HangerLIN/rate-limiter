package com.example.ratelimiter;

import java.util.concurrent.TimeUnit;

public class LeakyBucketLimiter {
    /**
     * 桶的最大容量
     */
    public long capacity = 10;
    /**
     * 桶内当前水量
     */
    public long count = 0;
    /**
     * 漏水速率（每秒5次）
     */
    public long rate = 5;
    /**
     * 上次漏水时间
     */
    public static long lastLeakTime = System.currentTimeMillis();
    /**
     * 限流方法，返回true表示通过
     */
    public synchronized boolean tryAcquire() {
        // 调用漏水方法
        this.leak();
        // 判断是否超过最大请求数量
        if (count < capacity) {
            count++;
            return true;
        }
        return false;
    }
 
    /**
     * 漏水方法，计算并更新这段时间内漏水量
     */
    private void leak() {
        // 获取系统当前时间
        long currentTime = System.currentTimeMillis();
        // 计算这段时间内，需要流出的水量
        long leakWater = (currentTime - lastLeakTime) * rate / 1000;
        count = Math.max(count - leakWater, 0);
        lastLeakTime = currentTime;
    }
 
    public static void main(String[] args) throws InterruptedException {
        LeakyBucketLimiter limiter = new LeakyBucketLimiter();
        for (int i = 0; i < 30; i++){
            if (limiter.tryAcquire()){
                System.out.println("任务" + (i + 1) + "成功执行");
            }else {
                System.out.println("任务" + (i + 1) + "被限流");
            }
            TimeUnit.MILLISECONDS.sleep(200);// 每次都可以漏出一个请求(每200ms可以成功执行一个请求，漏桶让出一个位置)
            // TimeUnit.MILLISECONDS.sleep(100);// 100ms 会导致每次无法漏出请求，漏桶满了无法继续接收新的请求
        }
    }
} 