import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  value: string;
}

export function CodeBlock({ language, value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 my-4 shadow-md group dark:bg-[#1e1e1e] dark:border-zinc-700">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/80 border-b border-zinc-700/80 dark:bg-[#252526] dark:border-zinc-700">
        <span className="text-xs font-mono text-zinc-400 capitalize">{language || 'text'}</span>
        <button
          onClick={handleCopy}
          className="p-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors rounded-md hover:bg-zinc-700/50"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-sm text-zinc-50 font-mono">
        <pre className="!bg-transparent !p-0 !m-0 selection:bg-blue-500/30">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
}
