import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User } from 'lucide-react';
import clsx from 'clsx';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={clsx(
        'flex w-full mt-2 space-x-3 max-w-3xl mx-auto px-4 py-6',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
            <Bot size={18} />
          </div>
        </div>
      )}
      
      <div
        className={clsx(
          'relative px-5 py-4 text-sm max-w-[80%] rounded-2xl shadow-sm overflow-hidden flex flex-col gap-3',
          isUser
            ? 'bg-zinc-800 text-zinc-100 rounded-tr-sm'
            : 'bg-white text-zinc-800 rounded-tl-sm border border-zinc-200'
        )}
      >
        {Array.isArray(message.content) && message.content.some((item: any) => item.type === 'image_url') && (
          <div className="flex flex-wrap gap-2 mb-2">
             {message.content.filter((item: any) => item.type === 'image_url').map((item: any, i: number) => (
                <img key={i} src={item.image_url.url} alt="upload" className="max-w-[200px] max-h-[200px] object-cover rounded-md border border-zinc-200/20" />
             ))}
          </div>
        )}
        <div className={clsx("prose prose-sm w-full max-w-none break-words", isUser ? "prose-invert" : "")}>
          <ReactMarkdown>
            {Array.isArray(message.content) 
               ? message.content.find((item: any) => item.type === 'text')?.text || '' 
               : message.content}
          </ReactMarkdown>
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white">
            <User size={18} />
          </div>
        </div>
      )}
    </div>
  );
}
