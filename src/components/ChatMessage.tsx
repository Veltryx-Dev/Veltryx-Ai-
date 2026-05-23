import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { Message } from '../types';
import { CodeBlock } from './CodeBlock';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  const content = Array.isArray(message.content) 
    ? message.content.find((item: any) => item.type === 'text')?.text || '' 
    : message.content;

  const images = Array.isArray(message.content) 
    ? message.content.filter((item: any) => item.type === 'image_url')
    : [];

  return (
    <div
      className={clsx(
        'flex w-full mt-4 space-x-4 max-w-3xl mx-auto px-4 py-2 group',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 mt-auto mb-1 hidden sm:block">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Sparkles size={18} />
          </div>
        </div>
      )}
      
      <div
        className={clsx(
          'relative px-6 py-4 text-[15px] max-w-[85%] sm:max-w-[75%] rounded-[2rem] shadow-sm overflow-hidden flex flex-col gap-3 transition-all duration-300',
          isUser
            ? 'bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 rounded-br-md shadow-zinc-900/10 dark:shadow-zinc-100/10'
            : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-50 rounded-bl-md border border-zinc-100 dark:border-zinc-700 shadow-xl shadow-zinc-200/20 dark:shadow-none'
        )}
      >
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
             {images.map((item: any, i: number) => (
                <img key={i} src={item.image_url.url} alt="upload" className="max-w-[240px] max-h-[240px] object-cover rounded-2xl border border-zinc-200/20 dark:border-zinc-700/50" />
             ))}
          </div>
        )}
        
        {content ? (
          <div className={clsx("prose prose-sm w-full max-w-none break-words prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent prose-pre:m-0", isUser ? "prose-invert dark:prose-zinc" : "prose-zinc dark:prose-invert")}>
            <ReactMarkdown
              components={{
                code({node, inline, className, children, ...props}: any) {
                  const match = /language-(\w+)/.exec(className || '')
                  if (!inline && match) {
                    return (
                      <CodeBlock
                        language={match[1]}
                        value={String(children).replace(/\n$/, '')}
                      />
                    )
                  }
                  return (
                    <code className={clsx(className, "bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded-md text-zinc-900 dark:text-zinc-200 text-sm font-mono")} {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="flex space-x-1.5 items-center h-6 px-1">
            <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 mt-auto mb-1 hidden sm:block">
          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shadow-sm">
            <User size={18} />
          </div>
        </div>
      )}
    </div>
  );
}
