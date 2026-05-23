import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Cpu, Paperclip, X, FileText, Image as ImageIcon, Menu, Sun, Moon } from 'lucide-react';
import clsx from 'clsx';
import { ChatMessage } from './components/ChatMessage';
import { Sidebar } from './components/Sidebar';
import { Message, Attachment, ChatSession } from './types';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('veltrxy_theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('veltrxy_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].role) {
          return [{
            id: 'migrated-session',
            title: 'Previous Conversation',
            messages: parsed,
            updatedAt: Date.now()
          }];
        }
        return parsed || [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    sessions.length > 0 ? sessions[0].id : null
  );

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('veltrxy_theme', theme);
  }, [theme]);

  useEffect(() => {
    scrollToBottom();
    localStorage.setItem('veltrxy_history', JSON.stringify(sessions));
  }, [sessions, currentSessionId, messages]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      updatedAt: Date.now()
    };
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newSession.id);
    setInput('');
    setAttachments([]);
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    setInput('');
    setAttachments([]);
  };

  const handleDeleteSession = (id: string) => {
    setSessions(prev => {
      const nextSessions = prev.filter(s => s.id !== id);
      if (currentSessionId === id) {
        setCurrentSessionId(nextSessions.length > 0 ? nextSessions[0].id : null);
      }
      return nextSessions;
    });
  };

  const clearConversation = () => {
    if (!currentSessionId) return;
    setSessions(prev => prev.map(s => 
      s.id === currentSessionId ? { ...s, messages: [], updatedAt: Date.now() } : s
    ));
    setAttachments([]);
  };

  const updateSessionMessages = (updater: (prevMessages: Message[]) => Message[], titleHint?: string) => {
    setSessions(prev => {
      let isNew = false;
      let targetId = currentSessionId;
      
      if (!targetId || !prev.find(s => s.id === targetId)) {
        targetId = Date.now().toString();
        isNew = true;
      }

      const existingSessions = isNew 
        ? [{ id: targetId, title: 'New Conversation', messages: [], updatedAt: Date.now() }, ...prev]
        : prev;

      return existingSessions.map(s => {
        if (s.id === targetId) {
          const newMessages = updater(s.messages);
          let newTitle = s.title;
          if (titleHint && (s.title === 'New Conversation' || !s.title)) {
            newTitle = titleHint.slice(0, 30) + (titleHint.length > 30 ? '...' : '');
          }
          return { ...s, messages: newMessages, updatedAt: Date.now(), title: newTitle };
        }
        return s;
      });
    });

    if (!currentSessionId || !sessions.find(s => s.id === currentSessionId)) {
      setSessions(prev => {
        if (prev.length > 0) setCurrentSessionId(prev[0].id);
        return prev;
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const files = Array.from(e.target.files);
    
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
    let titleHint = input.trim();
    
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
      if (content.length === 0) content = '';
      if (!titleHint) titleHint = attachments[0].file.name;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
    };

    updateSessionMessages(prev => [...prev, userMessage], titleHint);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    const botMessageId = (Date.now() + 1).toString();
    updateSessionMessages(prev => [
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

      if (!res.ok) throw new Error('Network response was not ok');
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
            if (dataStr.trim() === '[DONE]') break;
            try {
              const data = JSON.parse(dataStr);
              const content = data.choices[0]?.delta?.content || '';
              if (content) {
                currentText += content;
                updateSessionMessages(prev =>
                  prev.map((m) =>
                    m.id === botMessageId ? { ...m, content: currentText } : m
                  )
                );
              }
            } catch (err) {
              continue;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error during chat stream:', error);
      updateSessionMessages(prev =>
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
    <div className="flex h-screen bg-white dark:bg-[#09090b] font-sans text-zinc-900 dark:text-zinc-50 selection:bg-blue-200 dark:selection:bg-blue-900 overflow-hidden">
      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex-1 flex flex-col h-full relative z-0 min-w-0">
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-30 dark:opacity-20"></div>

        <header className="px-4 py-3 sm:px-6 sm:py-4 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between sticky top-0 z-10 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-sm shadow-blue-500/20">
              <Cpu className="text-white w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-zinc-800 dark:text-zinc-100 leading-tight">Veltrxy Ai</h1>
              <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium">Model: cyto-2.4 &middot; Accelerated</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl sm:rounded-2xl transition-all duration-300 group"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon size={18} className="sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" /> : <Sun size={18} className="sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />}
            </button>
            <button
              onClick={clearConversation}
              disabled={messages.length === 0}
              className="p-2 sm:p-2.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-xl sm:rounded-2xl transition-all duration-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400 group"
              title="Clear Conversation"
            >
              <Trash2 size={18} className="sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scroll-smooth pb-10 flex flex-col relative z-0">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 sm:px-6 animate-in fade-in duration-700 slide-in-from-bottom-8 relative z-10 w-full max-w-4xl mx-auto mt-8 sm:mt-0">
              <div className="relative mb-6 sm:mb-8 float-animation">
                <div className="absolute inset-0 bg-blue-400 blur-3xl opacity-20 dark:opacity-10 rounded-full"></div>
                <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-zinc-800 dark:to-zinc-900 border border-blue-100/50 dark:border-zinc-700/50 rounded-2xl sm:rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-500/10 relative">
                  <Cpu className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-800 dark:text-zinc-100 mb-3 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-900 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-100">
                How can Veltrxy Ai help?
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 max-w-lg text-[14px] sm:text-lg mb-8 sm:mb-10 leading-relaxed font-medium">
                Experience the power of our accelerated large language models. Write codes, design workflows, and spark ideas.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl px-2">
                {[
                  "Write a Python script for data analysis",
                  "Design a database schema for an e-commerce app",
                  "Explain quantum computing simply",
                  "Creative marketing ideas for a new cafe"
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(prompt); }}
                    className="text-left px-4 py-3 sm:px-5 sm:py-4 bg-white/60 dark:bg-[#18181b]/60 hover:bg-white dark:hover:bg-[#18181b] backdrop-blur-sm border border-zinc-200/60 dark:border-zinc-800/60 hover:border-blue-200 dark:hover:border-blue-500/30 rounded-xl sm:rounded-[1.5rem] shadow-sm hover:shadow-md transition-all duration-300 text-[13px] sm:text-[14px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 group"
                  >
                    <p className="font-medium group-hover:-translate-y-0.5 transition-transform">{prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 w-full pt-4 sm:pt-6 pb-2">
              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </main>

        <footer className="p-3 sm:px-6 sm:py-4 bg-gradient-to-t from-white via-white to-white/0 dark:from-[#09090b] dark:via-[#09090b] dark:to-[#09090b]/0 relative z-10 w-full mb-1 sm:mb-0">
          <div className="max-w-3xl mx-auto w-full">
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 px-2">
                {attachments.map(a => (
                  <div key={a.id} className="relative group p-1.5 pr-8 border border-zinc-200/60 dark:border-zinc-700/60 rounded-xl sm:rounded-2xl flex items-center gap-2 bg-white/80 dark:bg-zinc-800/80 backdrop-blur shadow-sm max-w-[200px] animate-in slide-in-from-bottom-2">
                    {a.type === 'image' ? (
                       <img src={a.dataUrl} className="w-8 h-8 sm:w-9 sm:h-9 object-cover rounded-lg sm:rounded-xl" alt="upload" />
                    ) : (
                       <div className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-50 dark:bg-blue-900/30 rounded-lg sm:rounded-xl flex items-center justify-center"><FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 dark:text-blue-400" /></div>
                    )}
                    <span className="text-[11px] sm:text-xs truncate font-medium text-zinc-700 dark:text-zinc-300">{a.file.name}</span>
                    <button 
                      onClick={() => removeAttachment(a.id)}
                      className="absolute right-1.5 sm:right-2 p-1 sm:p-1.5 rounded-full text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 transition-colors"
                    >
                      <X size={14} className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative group">
              <div className="absolute -inset-1 sm:-inset-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 rounded-[2rem] sm:rounded-[2.5rem] blur-lg sm:blur-xl opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
              <div className="relative flex items-end bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700/80 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm focus-within:shadow-md focus-within:border-blue-300/50 dark:focus-within:border-blue-500/50 transition-all overflow-hidden pl-2 pr-2 py-1.5 sm:pl-3 sm:pr-3 sm:py-3">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="mr-1 sm:mr-2 mb-0.5 shrink-0 text-zinc-400 dark:text-zinc-500 p-2 sm:p-3 rounded-full hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
                  title="Attach text documents or images"
                >
                  <Paperclip className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
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
                  placeholder="Ask Veltrxy anything..."
                  className="w-full max-h-32 sm:max-h-40 min-h-[40px] sm:min-h-[48px] bg-transparent border-none focus:outline-none resize-none py-2 sm:py-3 text-[14px] sm:text-base text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 leading-relaxed"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && attachments.length === 0) || isLoading}
                  className="ml-1 sm:ml-2 mb-0.5 shrink-0 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 p-2 sm:p-3 rounded-full hover:bg-black dark:hover:bg-zinc-200 transition-all disabled:opacity-30 disabled:hover:bg-zinc-900 dark:disabled:hover:bg-white shadow-sm flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11"
                >
                  <Send className={clsx("w-4 h-4 sm:w-5 sm:h-5", isLoading ? 'animate-pulse' : '')} />
                </button>
              </div>
            </div>
          </div>
          <p className="text-center text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 sm:mt-4 font-medium mb-1">
            Veltrxy Ai can make mistakes. Verify important information.
          </p>
        </footer>
      </div>
    </div>
  );
}
