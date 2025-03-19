package com.example.ratelimiter;

import java.util.concurrent.TimeUnit;

public class SlidingWindowLimiter {
    // 固定时间窗口大小，单位毫秒
    private long windowSize;
    // 固定窗口拆分的小窗口数
    private int windowNum;
    // 每个窗口允许通过最大请求数
    private int maxRequestCount;
    // 各个窗口内请求计数
    private int[] perWindowCount;
    // 请求总数
    private int totalCount;
    // 当前窗口下标
    private int windowId;
    // 每个小窗口大小，毫秒
    private long perWindowSize;
    // 窗口右边界
    private long windowRightBorder;
    
    /**
     * 构造函数
     * 
     * @param windowSize 固定时间窗口大小
     * @param windowNum 固定窗口拆分的小窗口数
     * @param maxRequestCount  每个窗口允许通过最大请求数
     */
    public SlidingWindowLimiter(long windowSize, int windowNum, int maxRequestCount) {
        this.windowSize = windowSize;
        this.windowNum = windowNum;
        this.maxRequestCount = maxRequestCount;
        perWindowCount = new int[windowNum];
        perWindowSize = windowSize / windowNum;
        windowRightBorder = System.currentTimeMillis();
    }
    
    /**
     * 限流方法
     * @return
     */
    public synchronized boolean tryAcquire() {
        long currentTime = System.currentTimeMillis();
        if (currentTime > windowRightBorder){// 窗口移动
            do {
                windowId = (++windowId) % windowNum;
                totalCount -= perWindowCount[windowId];
                perWindowCount[windowId]=0;
                windowRightBorder += perWindowSize;
            }while (windowRightBorder < currentTime);
        }
        if (totalCount < maxRequestCount){
            System.out.println("tryAcquire success, windowId = "+windowId);
            perWindowCount[windowId]++;
            totalCount++;
            return true;
        }else{
            System.out.println("tryAcquire fail, windowId = "+windowId);
            return false;
        }
    }
	
	/**
     * 测试方法
     * @param args
     * @throws InterruptedException
     */
	public static void main(String[] args) throws InterruptedException {
        // 10个小窗口，每个窗口100ms， 可以接收的最大请求数为10
        SlidingWindowLimiter slidingWindowLimiter = new SlidingWindowLimiter(1000, 10, 10);
        //TimeUnit.MILLISECONDS.sleep(900);// 构建窗口
        for (int i = 0; i < 40; i++) {
            boolean acquire = slidingWindowLimiter.tryAcquire();
            if (acquire){
                System.out.println("任务" + (i + 1)  + "执行任务 " + System.currentTimeMillis());
            }else{
                System.out.println("任务" + (i + 1) + "被限流 "+ System.currentTimeMillis());
            }
            TimeUnit.MILLISECONDS.sleep(50);
        }
    }
} 