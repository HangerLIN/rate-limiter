'use client';

import React, { useState } from 'react';
import { FaCopy } from 'react-icons/fa';

interface CodeBlockProps {
  code: string;
  language: string;
  title?: string;
}

export default function CodeBlock({ code, language, title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg overflow-hidden">
      {title && (
        <div className="bg-gray-800 text-gray-200 px-4 py-2 text-sm flex justify-between items-center">
          <span>{title}</span>
          <button 
            onClick={copyToClipboard} 
            className="text-gray-400 hover:text-white transition-colors"
            title="复制代码"
          >
            {copied ? '已复制!' : <FaCopy />}
          </button>
        </div>
      )}
      <div className="relative bg-gray-900 overflow-auto max-h-[300px]">
        <pre className="text-gray-200 p-4 text-sm font-mono">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
} 