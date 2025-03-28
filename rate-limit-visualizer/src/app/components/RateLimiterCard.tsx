'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import CodeBlock from './CodeBlock';

interface RateLimiterCardProps {
  title: string;
  description: string;
  children: ReactNode;
  implementationCode?: string;
}

export default function RateLimiterCard({ 
  title, 
  description, 
  children, 
  implementationCode 
}: RateLimiterCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
    >
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{description}</p>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/2">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 h-full">
              {children}
            </div>
          </div>
          
          {implementationCode && (
            <div className="w-full md:w-1/2">
              <CodeBlock 
                code={implementationCode} 
                language="java" 
                title={`${title} - Java 实现`}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 