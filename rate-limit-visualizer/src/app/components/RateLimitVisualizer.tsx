'use client';

import { Suspense, lazy } from 'react';
import { FiGithub } from 'react-icons/fi';

// 使用React.lazy替代next/dynamic
const RateLimiterCard = lazy(() => import('./RateLimiterCard'));
const FixedWindowLimiter = lazy(() => import('./FixedWindowLimiter'));
const SlidingWindowLimiter = lazy(() => import('./SlidingWindowLimiter'));
const TokenBucketLimiter = lazy(() => import('./TokenBucketLimiter'));
const LeakyBucketLimiter = lazy(() => import('./LeakyBucketLimiter'));

// 添加组件加载时的占位符
const LoadingFallback = () => (
  <div className="h-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
    <p className="text-gray-500 dark:text-gray-400">加载中...</p>
  </div>
);

// 各种限流算法的Java实现代码
const fixedWindowCode = `package com.example.ratelimiter;

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
}`;

const slidingWindowCode = `package com.example.ratelimiter;

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
            perWindowCount[windowId]++;
            totalCount++;
            return true;
        }else{
            return false;
        }
    }
}`;

const tokenBucketCode = `package com.example.ratelimiter;

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
}`;

const leakyBucketCode = `package com.example.ratelimiter;

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
}`;

export default function RateLimitVisualizer() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
            限流算法可视化
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            通过动画直观了解四种常见的限流算法工作原理
          </p>
        </header>

        <div className="flex flex-col space-y-12">
          <Suspense fallback={<LoadingFallback />}>
            <RateLimiterCard 
              title="固定窗口限流" 
              description="在固定时间窗口内限制请求数量，窗口结束时重置计数器。简单易实现，但在窗口边界可能出现突发流量。"
              implementationCode={fixedWindowCode}
            >
              <FixedWindowLimiter />
            </RateLimiterCard>
          </Suspense>
          
          <Suspense fallback={<LoadingFallback />}>
            <RateLimiterCard 
              title="滑动窗口限流" 
              description="基于时间的滑动窗口，计算过去一段时间内的请求数。比固定窗口更平滑，避免了窗口边界问题。"
              implementationCode={slidingWindowCode}
            >
              <SlidingWindowLimiter />
            </RateLimiterCard>
          </Suspense>
          
          <Suspense fallback={<LoadingFallback />}>
            <RateLimiterCard 
              title="令牌桶限流" 
              description="以固定速率向桶中添加令牌，每个请求消耗一个令牌。允许一定程度的突发流量（桶满时可以一次性消耗多个令牌），同时保证长期平均速率限制。"
              implementationCode={tokenBucketCode}
            >
              <TokenBucketLimiter />
            </RateLimiterCard>
          </Suspense>
          
          <Suspense fallback={<LoadingFallback />}>
            <RateLimiterCard 
              title="漏桶限流" 
              description="请求先进入桶中排队，然后以恒定速率处理。超出桶容量的请求被拒绝。与令牌桶不同，漏桶始终以固定速率处理请求，不允许任何突发流量，确保完全平滑的处理速率。"
              implementationCode={leakyBucketCode}
            >
              <LeakyBucketLimiter />
            </RateLimiterCard>
          </Suspense>
        </div>
        
        <footer className="mt-16 text-center text-gray-600 dark:text-gray-400">
          <p className="flex items-center justify-center gap-2">
            <FiGithub className="inline" />
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              查看源代码
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
} 