'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCoins, FaBan, FaCheckCircle, FaArrowDown, FaArrowUp } from 'react-icons/fa';

export default function TokenBucketLimiter() {
  const [tokens, setTokens] = useState(5); // 初始令牌数为中等值
  const [maxTokens] = useState(10);
  const [refillRate, setRefillRate] = useState(2); // 默认每秒生成2个令牌
  const [requestBurst, setRequestBurst] = useState(false);
  const [requests, setRequests] = useState<{ id: number; status: 'accepted' | 'rejected' }[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [requestsCount, setRequestsCount] = useState({ accepted: 0, rejected: 0 });
  const [showRefillOptions, setShowRefillOptions] = useState(false);

  // 生成令牌
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isRunning) {
      // 每秒生成令牌的定时器
      timer = setInterval(() => {
        setTokens(curr => Math.min(curr + refillRate, maxTokens));
      }, 1000);
    }
    
    return () => clearInterval(timer);
  }, [isRunning, maxTokens, refillRate]);

  // 消费令牌（模拟请求）
  useEffect(() => {
    let requestTimer: NodeJS.Timeout;
    
    if (isRunning) {
      // 模拟请求，根据模式选择间隔
      const interval = requestBurst ? 100 : 800; // 突发模式下请求极为频繁
      
      requestTimer = setInterval(() => {
        const status = tokens > 0 ? 'accepted' as const : 'rejected' as const;
        const newRequest = { 
          id: Date.now(), 
          status
        };
        
        if (newRequest.status === 'accepted') {
          setTokens(curr => curr - 1);
          setRequestsCount(prev => ({ ...prev, accepted: prev.accepted + 1 }));
        } else {
          setRequestsCount(prev => ({ ...prev, rejected: prev.rejected + 1 }));
        }
        
        setRequests(prev => [...prev, newRequest].slice(-10));
      }, interval);
    }
    
    return () => clearInterval(requestTimer);
  }, [isRunning, tokens, requestBurst]);

  // 重置函数
  const resetSimulation = () => {
    setTokens(5); // 重置为初始令牌数
    setRequests([]);
    setRequestsCount({ accepted: 0, rejected: 0 });
  };
  
  // 预填充令牌桶
  const prefillTokens = () => {
    setTokens(maxTokens);
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            令牌: {tokens}/{maxTokens}
          </span>
          <div className="relative">
            <button
              onClick={() => setShowRefillOptions(!showRefillOptions)}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 flex items-center"
            >
              令牌速率: {refillRate}/秒 ▼
            </button>
            {showRefillOptions && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 shadow-md rounded-md z-20 py-1">
                {[1, 2, 3, 5].map(rate => (
                  <button
                    key={rate}
                    onClick={() => {
                      setRefillRate(rate);
                      setShowRefillOptions(false);
                    }}
                    className={`block w-full text-left px-3 py-1 text-xs ${
                      refillRate === rate 
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {rate}/秒
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          {!isRunning && (
            <button
              onClick={prefillTokens}
              className="px-2 py-1 text-xs rounded bg-blue-500 text-white"
              title="预填充令牌桶以应对突发流量"
            >
              填满令牌
            </button>
          )}
          <button 
            onClick={() => setRequestBurst(!requestBurst)}
            className={`px-2 py-1 text-xs rounded ${
              requestBurst 
                ? 'bg-yellow-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-yellow-200'
            }`}
            title={requestBurst ? "切换到正常请求速率" : "切换到突发请求模式"}
          >
            {requestBurst ? "突发中" : "突发"}
          </button>
          <button 
            onClick={() => {
              if (isRunning) {
                setIsRunning(false);
                setRequestBurst(false);
              } else {
                resetSimulation();
                setIsRunning(true);
              }
            }}
            className={`px-3 py-1 rounded text-white ${isRunning ? 'bg-red-500' : 'bg-green-500'}`}
          >
            {isRunning ? '停止' : '开始'}
          </button>
        </div>
      </div>
      
      <div className="h-52 bg-gray-100 dark:bg-gray-700 rounded-lg relative overflow-hidden">
        {/* 令牌桶可视化 */}
        <div className="absolute bottom-0 left-0 right-0 bg-amber-100 dark:bg-amber-900 rounded-t-lg overflow-hidden" style={{ height: '60%' }}>
          <div className="absolute top-0 left-0 right-0 border-b border-dashed border-amber-500 dark:border-amber-400 z-10"></div>
          <motion.div 
            className="absolute bottom-0 left-0 right-0 bg-amber-400 dark:bg-amber-600"
            animate={{ height: `${(tokens / maxTokens) * 100}%` }}
            transition={{ type: 'spring', damping: 10 }}
          >
            {isRunning && (
              <motion.div
                className="absolute -top-3 right-1/2 transform translate-x-1/2 text-amber-600 dark:text-amber-300"
                animate={{ y: tokens < maxTokens ? [0, -5, 0] : 0 }}
                transition={{ duration: 1, repeat: tokens < maxTokens ? Infinity : 0, repeatType: "loop" }}
              >
                <FaArrowUp size={16} />
              </motion.div>
            )}
            
            <AnimatePresence>
              {Array.from({ length: Math.min(tokens, 15) }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="absolute"
                  style={{
                    left: `${((i % 5) / 5) * 100 + 10}%`,
                    bottom: `${Math.floor(i / 5) * 20 + 10}%`,
                  }}
                >
                  <FaCoins className="text-amber-600 dark:text-amber-300" />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
        
        {/* 消耗令牌的动画 */}
        {isRunning && requests.length > 0 && requests[requests.length-1].status === 'accepted' && (
          <motion.div 
            className="absolute bottom-[30%] right-1/2 transform translate-x-1/2 text-amber-600 dark:text-amber-300"
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.5, repeat: 1, repeatType: "loop" }}
          >
            <FaArrowDown size={16} />
          </motion.div>
        )}
        
        <div className="absolute top-2 right-2 left-2">
          <div className="flex flex-col items-center mb-2">
            <div className="flex space-x-3 text-xs mb-1">
              <span className="text-green-500">通过: {requestsCount.accepted}</span>
              <span className="text-red-500">拒绝: {requestsCount.rejected}</span>
            </div>
            {tokens === 0 && requestBurst && (
              <p className="text-xs text-red-500 animate-pulse">令牌已用完，突发请求被拒绝，但会继续生成新令牌</p>
            )}
            {tokens === 0 && !requestBurst && (
              <p className="text-xs text-red-500 animate-pulse">令牌已用完，请求被拒绝</p>
            )}
            {requestBurst && tokens > 0 && (
              <p className="text-xs text-yellow-600 animate-pulse">处理突发流量中...({tokens}个令牌可用)</p>
            )}
            {tokens === maxTokens && (
              <p className="text-xs text-green-500">令牌已满，可以处理突发流量</p>
            )}
          </div>
          <div className="flex flex-wrap justify-center">
            {requests.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">点击"开始"按钮查看限流效果</p>
            ) : (
              <AnimatePresence>
                {requests.map((req) => (
                  <motion.div
                    key={req.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className={`flex items-center justify-center w-8 h-8 m-1 rounded-full ${
                      req.status === 'accepted' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                    }`}
                  >
                    {req.status === 'accepted' ? (
                      <FaCheckCircle className="text-green-500 dark:text-green-300" />
                    ) : (
                      <FaBan className="text-red-500 dark:text-red-300" />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 