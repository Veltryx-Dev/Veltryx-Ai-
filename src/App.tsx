import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Cpu, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { Message, Attachment } from './types';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const clearConversation = () => {
    setMessages([]);
    setAttachments([]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    
    // Process files one by one with a simple loader
    setIsLoading(true);
    try {
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target?.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          setAttachments(prev => [...prev, {
            id: Date.now().toString() + Math.random(),
            file,
            type: 'image',
            dataUrl
          }]);
        } else {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/parse-document', {
            method: 'POST',
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            if (data.text) {
              setAttachments(prev => [...prev, {
                id: Date.now().toString() + Math.random(),
                file,
                type: 'document',
                parsedText: data.text
              }]);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error handling files', err);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    let content: any = input.trim();
    
    if (attachments.length > 0) {
      content = [];
      let combinedText = input.trim();
      const docTexts = attachments.filter(a => a.type === 'document').map(a => `\n\n[Document: ${a.file.name}]\n${a.parsedText}\n`);
      if (docTexts.length) {
        combinedText += docTexts.join('');
      }
      if (combinedText) {
        content.push({ type: 'text', text: combinedText });
      }
      attachments.filter(a => a.type === 'image').forEach(a => {
        content.push({ type: 'image_url', image_url: { url: a.dataUrl } });
      });
      // Fallback if there was no text but there is an image
      if (content.length === 0) {
         content = ''; // Should not happen if there are images, but just in case
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    const botMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: botMessageId, role: 'assistant', content: '' },
    ]);

    try {
      const messagesPayload = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesPayload,
          stream: true,
        }),
      });

      if (!res.ok) {
        throw new Error('Network response was not ok');
      }

      if (!res.body) throw new Error('No response body');
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let currentText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr.trim() === '[DONE]') {
              break;
            }
            try {
              const data = JSON.parse(dataStr);
              const content = data.choices[0]?.delta?.content || '';
              if (content) {
                currentText += content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMessageId ? { ...m, content: currentText } : m
                  )
                );
              }
            } catch (err) {
              // Ignore invalid JSON chunks, parsing boundary issues, etc.
              continue;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error during chat stream:', error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMessageId
            ? { ...m, content: 'Error: Failed to fetch response.' }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-50 font-sans text-zinc-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-200 shadow-sm sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Cpu className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight leading-none mb-1">Veltrxy Ai</h1>
            <p className="text-xs text-zinc-500 font-medium">Model: cyto-2.4 &middot; Streaming Enabled</p>
          </div>
        </div>
        <button
          onClick={clearConversation}
          disabled={messages.length === 0}
          className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-zinc-500"
          title="Clear Conversation"
        >
          <Trash2 size={20} />
        </button>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto scroll-smooth pb-4 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <Cpu className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Welcome to Veltrxy Ai</h2>
            <p className="text-zinc-500 max-w-md">
              Send a message below to start a conversation with the cyto-2.4 model.
            </p>
          </div>
        ) : (
          <div className="flex-1 w-full pt-4">
            {messages.map((m) => (
              <ChatMessage key={m.id} message={m} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className="p-4 bg-white border-t border-zinc-200">
        <div className="max-w-3xl mx-auto">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {attachments.map(a => (
                <div key={a.id} className="relative group p-2 pr-8 border border-zinc-200 rounded-lg flex items-center gap-2 bg-zinc-50 max-w-[200px]">
                  {a.type === 'image' ? (
                     <img src={a.dataUrl} className="w-8 h-8 object-cover rounded" alt="upload" />
                  ) : (
                     <FileText className="w-8 h-8 text-blue-500 p-1" />
                  )}
                  <span className="text-xs truncate font-medium text-zinc-700">{a.file.name}</span>
                  <button 
                    onClick={() => removeAttachment(a.id)}
                    className="absolute right-1.5 p-1 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end bg-white border border-zinc-300 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all overflow-hidden pl-2 pr-2 py-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="mr-2 mb-1 shrink-0 text-zinc-400 p-2.5 rounded-xl hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
              title="Attach File or Image"
            >
              <Paperclip size={20} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange}
              multiple 
              accept="image/*,.pdf,.docx,.txt,.csv,.json"
            />
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Veltrxy..."
              className="w-full max-h-32 min-h-[44px] bg-transparent border-none focus:outline-none resize-none py-3 text-zinc-800 placeholder-zinc-400"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && attachments.length === 0) || isLoading}
              className="ml-2 mb-1 shrink-0 bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:hover:bg-blue-600 disabled:hover:opacity-50"
            >
              <Send size={18} className={isLoading ? 'animate-pulse' : ''} />
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-zinc-400 mt-3 font-medium">
          Veltrxy Ai can make mistakes. Verify important information.
        </p>
      </footer>
    </div>
  );
}
