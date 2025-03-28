'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWater, FaBan, FaCheckCircle, FaArrowDown, FaArrowUp } from 'react-icons/fa';

export default function LeakyBucketLimiter() {
  const [queue, setQueue] = useState<number[]>([]);
  const [queueSize] = useState(8);
  const [processRate, setProcessRate] = useState(1); // 每秒处理的请求数（恒定速率）
  const [requestBurst, setRequestBurst] = useState(false); // 控制请求突发模式
  const [requests, setRequests] = useState<{ id: number; status: 'queued' | 'rejected' | 'processed' }[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [requestsCount, setRequestsCount] = useState({ queued: 0, processed: 0, rejected: 0 });
  const [showProcessRateOptions, setShowProcessRateOptions] = useState(false);
  const [highlightConstantRate, setHighlightConstantRate] = useState(false);
  const [leakingDropVisible, setLeakingDropVisible] = useState(false);
  const processedRequestRef = useRef<number | null>(null);

  // 定期处理队列中的请求（以恒定速率）
  useEffect(() => {
    let processTimer: NodeJS.Timeout;
    
    if (isRunning) {
      processTimer = setInterval(() => {
        if (queue.length > 0) {
          // 从队列中移除一个请求（先进先出）- 恒定速率
          const processedRequestId = queue.shift();
          setQueue([...queue]);
          
          // 标记请求为已处理
          if (processedRequestId) {
            // 保存当前正在处理的请求ID，用于显示动画
            processedRequestRef.current = processedRequestId;
            
            // 显示漏水动画
            setLeakingDropVisible(true);
            setTimeout(() => {
              setLeakingDropVisible(false);
              
              // 更新请求状态
              setRequests(prev => 
                prev.map(req => 
                  req.id === processedRequestId 
                    ? { ...req, status: 'processed' as const } 
                    : req
                )
              );
              setRequestsCount(prev => ({ ...prev, processed: prev.processed + 1, queued: Math.max(0, prev.queued - 1) }));
              
              processedRequestRef.current = null;
            }, 800); // 动画持续时间
            
            // 如果开启了突发模式，但请求突发太多，短暂高亮显示固定速率提示
            if (requestBurst && queue.length > queueSize * 0.7) {
              setHighlightConstantRate(true);
              setTimeout(() => setHighlightConstantRate(false), 2000);
            }
          }
        }
      }, 1000 / processRate); // 恒定的处理速率，无论输入流量如何
    }
    
    return () => clearInterval(processTimer);
  }, [isRunning, queue, processRate, requestBurst, queueSize]);

  // 模拟请求到达
  useEffect(() => {
    let arrivalTimer: NodeJS.Timeout;
    
    if (isRunning) {
      // 根据模式选择请求到达频率
      const baseInterval = requestBurst ? 100 : 800; // 突发模式下请求极为频繁
      
      arrivalTimer = setInterval(() => {
        const requestId = Date.now();
        let status: 'queued' | 'rejected';
        
        // 如果队列未满，将请求加入队列，否则拒绝
        if (queue.length < queueSize) {
          setQueue(prev => [...prev, requestId]);
          status = 'queued';
          setRequestsCount(prev => ({ ...prev, queued: prev.queued + 1 }));
        } else {
          status = 'rejected';
          setRequestsCount(prev => ({ ...prev, rejected: prev.rejected + 1 }));
        }
        
        // 添加新请求到请求历史
        setRequests(prev => [...prev, { id: requestId, status }].slice(-15));
      }, baseInterval + (requestBurst ? 0 : Math.random() * 300)); // 突发模式下请求更稳定、更频繁
    }
    
    return () => clearInterval(arrivalTimer);
  }, [isRunning, queue, queueSize, requestBurst]);

  // 重置函数
  const resetSimulation = () => {
    setQueue([]);
    setRequests([]);
    setRequestsCount({ queued: 0, processed: 0, rejected: 0 });
    setHighlightConstantRate(false);
    setLeakingDropVisible(false);
    processedRequestRef.current = null;
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            队列: {queue.length}/{queueSize}
          </span>
          <div className="relative">
            <button
              onClick={() => setShowProcessRateOptions(!showProcessRateOptions)}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 flex items-center"
            >
              处理速率: {processRate}/秒 <span className={highlightConstantRate ? "ml-1 text-yellow-500 animate-pulse font-bold" : "ml-1"}>(恒定)</span> ▼
            </button>
            {showProcessRateOptions && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 shadow-md rounded-md z-20 py-1">
                {[1, 2, 3].map(rate => (
                  <button
                    key={rate}
                    onClick={() => {
                      setProcessRate(rate);
                      setShowProcessRateOptions(false);
                    }}
                    className={`block w-full text-left px-3 py-1 text-xs ${
                      processRate === rate 
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
          <button 
            onClick={() => setRequestBurst(!requestBurst)}
            className={`px-2 py-1 text-xs rounded ${requestBurst ? 'bg-yellow-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}
            title={requestBurst ? "切换到正常请求速率" : "模拟突发请求 (漏桶将限制输出速率)"}
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
      
      <div className="h-56 bg-gray-100 dark:bg-gray-700 rounded-lg relative overflow-hidden">
        <div className="absolute top-2 left-2 right-2">
          <div className="flex flex-col items-center mb-1">
            <div className="flex space-x-3 text-xs mb-1">
              <span className="text-green-500">处理: {requestsCount.processed}</span>
              <span className="text-yellow-500">队列: {requestsCount.queued}</span>
              <span className="text-red-500">拒绝: {requestsCount.rejected}</span>
            </div>
            {queue.length === queueSize && (
              <p className="text-xs text-red-500 animate-pulse">桶已满，新请求被拒绝</p>
            )}
            {requestBurst && queue.length > 0 && (
              <p className="text-xs text-blue-500">
                <span className={highlightConstantRate ? "text-yellow-500 font-bold animate-pulse" : ""}>
                  即使有突发流量，输出仍保持恒定速率
                </span>
              </p>
            )}
          </div>
        </div>
        
        {/* 请求入口标记 */}
        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 px-2 rounded-md shadow-sm">
          请求入口
        </div>
        
        {/* 漏桶可视化 */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 w-36 h-36">
          {/* 入口动画 */}
          {isRunning && (
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
              <motion.div 
                className="text-blue-500"
                animate={{ y: [0, 5, 0] }}
                transition={{ 
                  duration: requestBurst ? 0.3 : 0.8, 
                  repeat: Infinity 
                }}
              >
                <FaArrowDown size={16} />
              </motion.div>
              
              {/* 进入桶的请求动画 */}
              {requestBurst && (
                <div className="relative h-6">
                  <motion.div 
                    className="absolute"
                    animate={{ 
                      y: [0, 10, 20], 
                      opacity: [1, 1, 0]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 0.4, 
                      repeatType: "loop" 
                    }}
                  >
                    <FaWater className="text-blue-500" size={12} />
                  </motion.div>
                </div>
              )}
            </div>
          )}
          
          {/* 桶 */}
          <div className="absolute inset-0 border-4 border-blue-500 rounded-lg" 
               style={{ borderTopWidth: '1px', borderStyle: 'dashed solid solid solid' }}>
            <div className="absolute top-0 left-0 right-0 border-b border-dashed border-blue-500" style={{ height: '25%' }}>
              <div className="text-xs text-blue-500 text-center">请求队列</div>
            </div>
            
            {/* 水线 - 可视化队列容量 */}
            <motion.div 
              className="absolute bottom-0 left-0 right-0 bg-blue-400 dark:bg-blue-600 transition-all"
              style={{ height: `${(queue.length / queueSize) * 90}%` }}
              animate={{ 
                height: `${(queue.length / queueSize) * 90}%`,
                backgroundColor: queue.length >= queueSize * 0.8 ? '#ef4444' : '#60a5fa' 
              }}
              transition={{ type: 'spring', damping: 8 }}
            >
              {/* 水滴 - 队列中的请求 */}
              <AnimatePresence>
                {Array.from({ length: Math.min(queue.length, 12) }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute text-blue-600 dark:text-blue-300"
                    style={{
                      left: `${((i % 4) / 4) * 80 + 10}%`,
                      bottom: `${Math.floor(i / 4) * 25 + 10}%`,
                    }}
                  >
                    <FaWater />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
          
          {/* 漏水口标记 */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 px-2 rounded-md shadow-sm">
            恒定速率出口
          </div>
          
          {/* 漏水口 - 恒定速率输出 */}
          <div className="absolute -bottom-11 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
            <div className="h-1 w-1 bg-blue-500 rounded-full mb-1"></div>
            
            {/* 漏出的水滴动画 */}
            {isRunning && (
              <div className="relative">
                {leakingDropVisible && (
                  <motion.div
                    className="absolute top-0 left-0"
                    initial={{ y: -5, opacity: 1 }}
                    animate={{ y: 15, opacity: 0 }}
                    transition={{ duration: 0.8, ease: "linear" }}
                  >
                    <FaWater className="text-blue-500" />
                  </motion.div>
                )}
                
                <motion.div 
                  className={`text-blue-500 ${highlightConstantRate ? 'text-yellow-500' : ''}`}
                  animate={{ opacity: queue.length > 0 ? [1, 0.5, 1] : 0 }}
                  transition={{ 
                    duration: 1, 
                    repeat: Infinity, 
                    repeatType: "loop", 
                    ease: "linear" // 线性过渡强调恒定速率
                  }}
                >
                  <FaWater />
                </motion.div>
                
                {highlightConstantRate && (
                  <motion.div 
                    className="absolute top-0 left-0 right-0 bottom-0 rounded-full bg-yellow-400 opacity-50"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.3, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </div>
            )}
            <div className={`text-xs mt-2 text-center ${highlightConstantRate ? 'text-yellow-500 font-bold' : 'text-blue-500'}`}>
              {isRunning && <span>恒定{processRate}/秒</span>}
            </div>
          </div>
        </div>
        
        {/* 处理后的请求出口标记 */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 px-2 rounded-md shadow-sm">
          处理后的请求
        </div>
        
        {/* 请求结果展示 */}
        <div className="absolute bottom-3 right-2 left-2">
          <div className="flex flex-wrap justify-center mt-4">
            {requests.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">点击"开始"按钮查看限流效果</p>
            ) : (
              <AnimatePresence>
                {requests.slice(-8).map((req) => (
                  <motion.div
                    key={req.id}
                    initial={{ scale: 0 }}
                    animate={{ 
                      scale: 1,
                      x: req.status === 'processed' && req.id === processedRequestRef.current ? [0, 0, 0] : 0,
                      y: req.status === 'processed' && req.id === processedRequestRef.current ? [0, -10, 0] : 0
                    }}
                    exit={{ scale: 0 }}
                    className={`flex items-center justify-center w-6 h-6 m-1 rounded-full ${
                      req.status === 'processed' ? 'bg-green-100 dark:bg-green-900' : 
                      req.status === 'queued' ? 'bg-yellow-100 dark:bg-yellow-900' : 
                      'bg-red-100 dark:bg-red-900'
                    }`}
                  >
                    {req.status === 'processed' ? (
                      <FaCheckCircle className="text-green-500 dark:text-green-300 text-xs" />
                    ) : req.status === 'queued' ? (
                      <FaWater className="text-yellow-500 dark:text-yellow-300 text-xs" />
                    ) : (
                      <FaBan className="text-red-500 dark:text-red-300 text-xs" />
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