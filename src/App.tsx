import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Cpu, Paperclip, X, FileText, Image as ImageIcon, Menu, Sun, Moon, Sparkles, MessageSquare, Search, Scan, UserCheck, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { ChatMessage } from './components/ChatMessage';
import { Sidebar } from './components/Sidebar';
import { Message, Attachment, ChatSession } from './types';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('veltrxy_theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  const [mode, setMode] = useState<'chat' | 'research' | 'detector' | 'humanizer'>('chat');
  const [selectedModel, setSelectedModel] = useState<string>('cyto-2.4');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

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
        if (Array.isArray(parsed)) {
          return parsed.map(s => ({
            ...s,
            id: s?.id || Date.now().toString() + Math.random(),
            title: s?.title || 'New Conversation',
            messages: Array.isArray(s?.messages) ? s.messages : [],
            updatedAt: s?.updatedAt || Date.now(),
          }));
        }
        return [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    sessions.length > 0 ? sessions[0].id : null
  );

  const currentSessionIdRef = useRef<string | null>(currentSessionId);
  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
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
    // Basic anti-tamper and DevTools blocking
    const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); return false; };
    const handleDragStart = (e: DragEvent) => { e.preventDefault(); return false; };
    const blockClipboard = (e: ClipboardEvent) => { e.preventDefault(); return false; };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) ||
        (e.ctrlKey && ['U', 'u', 'S', 's', 'P', 'p', 'A', 'a'].includes(e.key))
      ) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('copy', blockClipboard);
    document.addEventListener('cut', blockClipboard);
    document.addEventListener('paste', blockClipboard);

    // Advanced anti-debugging
    const trap = function() {
      try {
        // eslint-disable-next-line no-eval
        (function() { return false; })['constructor']('debugger')['call']();
      } catch (err) {}
    };

    const antiDebug = setInterval(() => {
      const before = new Date().getTime();
      trap();
      const after = new Date().getTime();
      if (after - before > 50) {
        document.body.innerHTML = '<div style="color:red;font-size:24px;text-align:center;margin-top:20vh;">Security Violation Detected</div>';
        window.location.replace('about:blank');
      }
    }, 500);

    // Detect DevTools via toString trap
    const element = new Image();
    Object.defineProperty(element, 'id', {
      get: function() {
        document.body.innerHTML = '<div style="color:red;font-size:24px;text-align:center;margin-top:20vh;">Security Violation Detected</div>';
        window.location.replace('about:blank');
        return '';
      }
    });
    console.log('%c', element);

    // Console override
    if (typeof window !== 'undefined') {
      const noop = () => {};
      ['log', 'debug', 'info', 'warn', 'error', 'table', 'trace', 'dir', 'dirxml', 'group', 'groupCollapsed', 'groupEnd', 'clear', 'count', 'countReset', 'assert', 'profile', 'profileEnd', 'time', 'timeEnd', 'timeLog', 'timeStamp'].forEach((method) => {
        (console as any)[method] = noop;
      });
    }

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('copy', blockClipboard);
      document.removeEventListener('cut', blockClipboard);
      document.removeEventListener('paste', blockClipboard);
      clearInterval(antiDebug);
    };
  }, []);

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
    let targetId = currentSessionIdRef.current;
    
    setSessions(prev => {
      let isNew = false;
      
      if (!targetId || !prev.find(s => s.id === targetId)) {
        targetId = Date.now().toString();
        isNew = true;
        // Schedule setting the current ID soon as we exit this setter
        setTimeout(() => setCurrentSessionId(targetId), 0);
        currentSessionIdRef.current = targetId;
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

      let systemPrompt = "";
      if (mode === 'research') {
        systemPrompt = "You are an expert researcher. Provide a highly detailed, well-structured, and comprehensive research summary on the given topic. Use markdown formatting, bullet points, and cite potential sources or common knowledge.";
      } else if (mode === 'detector') {
        systemPrompt = "You are an advanced AI text detector. Analyze the following text and determine if it was written by an AI or a human. Provide a percentage likelihood of AI generation and explain your reasoning clearly. Focus entirely on AI detection parameters.";
      } else if (mode === 'humanizer') {
        systemPrompt = "You are an expert humanizer and editor. Your task is to rewrite the user's text so that it sounds completely natural, human-written, and passes AI detection. Use varied sentence structures, a natural tone, and conversational phrasing.";
      }

      if (systemPrompt) {
        messagesPayload.unshift({ role: 'system', content: systemPrompt });
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesPayload,
          stream: true,
          model: selectedModel,
        }),
      });

      if (!res.ok) {
        let errMessage = 'Network response was not ok';
        try {
          const errorData = await res.json();
          if (errorData.error) errMessage = errorData.error;
        } catch(e) {}
        throw new Error(errMessage);
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
    } catch (error: any) {
      console.error('Error during chat stream:', error);
      updateSessionMessages(prev =>
        prev.map((m) =>
          m.id === botMessageId
            ? { ...m, content: `Error: ${error.message || 'Failed to fetch response.'}` }
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
    <div className="flex h-screen bg-transparent font-sans text-zinc-900 dark:text-zinc-50 selection:bg-blue-200 dark:selection:bg-blue-900 overflow-hidden">
      <div className="absolute inset-0 z-[-1] bg-slate-50 dark:bg-[#020617] mesh-bg-light dark:mesh-bg transition-colors duration-1000" />
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
        <header className="px-4 py-3 sm:px-6 sm:py-5 bg-white/50 dark:bg-[#020617]/50 backdrop-blur-xl border-b border-white/20 dark:border-white/5 flex items-center justify-between sticky top-0 z-10 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-white/5 rounded-xl transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-500/20 ring-1 ring-white/20 inset-ring">
              <Cpu className="text-white w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            </div>
            <div className="relative">
              <button 
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="flex flex-col items-start px-2 py-1 rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-colors group text-left"
              >
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight font-sans">VELTRXY</h1>
                  <ChevronDown className={clsx("w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-800 dark:group-hover:text-zinc-200 transition-transform", isModelDropdownOpen && "rotate-180")} />
                </div>
                <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  CYTO-2.4 &middot; ACCELERATED
                </p>
              </button>

              {isModelDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsModelDropdownOpen(false)} />
                  <div className="absolute top-full mt-2 left-0 z-50 w-56 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden p-1.5 animate-in fade-in slide-in-from-top-2">
                    <button
                      onClick={() => { setSelectedModel('cyto-2.4'); setIsModelDropdownOpen(false); }}
                      className={clsx(
                        "w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between",
                        selectedModel === 'cyto-2.4' ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                      )}
                    >
                      <div className="flex flex-col">
                        <span>Cyto-2.4</span>
                        <span className="text-[10px] font-normal opacity-70">Default, fast model</span>
                      </div>
                      {selectedModel === 'cyto-2.4' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-white/5 rounded-xl sm:rounded-2xl transition-all duration-300 group"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon size={18} className="sm:w-5 sm:h-5 group-hover:-rotate-12 transition-transform" /> : <Sun size={18} className="sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" />}
            </button>
            <button
              onClick={clearConversation}
              disabled={messages.length === 0}
              className="p-2 sm:p-2.5 text-zinc-500 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-500/10 rounded-xl sm:rounded-2xl transition-all duration-300 disabled:opacity-30 disabled:hover:bg-transparent group"
              title="Clear Conversation"
            >
              <Trash2 size={18} className="sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scroll-smooth pb-48 lg:pb-52 flex flex-col relative z-0">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 sm:px-6 animate-in fade-in duration-1000 slide-in-from-bottom-8 relative z-10 w-full max-w-4xl mx-auto mt-8 sm:mt-0">
              <div className="relative mb-8 sm:mb-12 float-animation">
                <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 dark:opacity-30 rounded-full animate-pulse-slow"></div>
                <div className="w-16 h-16 sm:w-28 sm:h-28 bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[2rem] sm:rounded-[3rem] flex items-center justify-center shadow-2xl relative">
                  <Sparkles className="w-8 h-8 sm:w-12 sm:h-12 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-4 sm:mb-6 font-sans">
                What will you create?
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 max-w-xl text-[15px] sm:text-xl mb-10 sm:mb-12 leading-relaxed font-medium">
                Experience the power of our accelerated intelligence.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-3xl px-2">
                {[
                  "Write a Python script for data analysis",
                  "Design a database schema for an e-commerce app",
                  "Explain quantum computing simply",
                  "Creative marketing ideas for a new cafe"
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(prompt); }}
                    className="text-left px-5 py-4 sm:px-6 sm:py-5 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border border-white/60 dark:border-white/5 hover:bg-white/60 dark:hover:bg-zinc-800/60 rounded-2xl sm:rounded-[1.5rem] shadow-sm hover:shadow-lg transition-all duration-300 text-[14px] sm:text-[15px] text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 group"
                  >
                    <p className="font-medium group-hover:translate-x-1 transition-transform">{prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 w-full pt-6 pb-2 max-w-4xl mx-auto">
              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </main>

        <footer className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent dark:from-[#020617] dark:via-[#020617] dark:to-transparent z-20 pointer-events-none">
          <div className="max-w-4xl mx-auto w-full pointer-events-auto">
            <div className="flex flex-wrap items-center gap-2 mb-3 px-2 sm:px-0">
              <button
                onClick={() => setMode('chat')}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all shadow-sm border",
                  mode === 'chat' 
                    ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30" 
                    : "bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                )}
              >
                <MessageSquare size={14} />
                Chat
              </button>
              <button
                onClick={() => setMode('research')}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all shadow-sm border",
                  mode === 'research' 
                    ? "bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/30" 
                    : "bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                )}
              >
                <Search size={14} />
                Research
              </button>
              <button
                onClick={() => setMode('detector')}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all shadow-sm border",
                  mode === 'detector' 
                    ? "bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/30" 
                    : "bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                )}
              >
                <Scan size={14} />
                AI Detector
              </button>
              <button
                onClick={() => setMode('humanizer')}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-all shadow-sm border",
                  mode === 'humanizer' 
                    ? "bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/30" 
                    : "bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                )}
              >
                <UserCheck size={14} />
                Humanizer
              </button>
            </div>

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 px-2">
                {attachments.map(a => (
                  <div key={a.id} className="relative group p-1.5 pr-8 border border-white/40 dark:border-white/10 rounded-xl sm:rounded-2xl flex items-center gap-2 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl shadow-sm max-w-[200px] animate-in slide-in-from-bottom-2">
                    {a.type === 'image' ? (
                       <img src={a.dataUrl} className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-lg sm:rounded-xl" alt="upload" />
                    ) : (
                       <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg sm:rounded-xl flex items-center justify-center"><FileText className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 dark:text-indigo-400" /></div>
                    )}
                    <span className="text-[11px] sm:text-xs truncate font-medium text-zinc-700 dark:text-zinc-300">{a.file.name}</span>
                    <button 
                      onClick={() => removeAttachment(a.id)}
                      className="absolute right-1.5 sm:right-2 p-1 sm:p-1.5 rounded-full text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-white dark:hover:bg-white/10 transition-colors shadow-sm bg-white/50 dark:bg-black/20"
                    >
                      <X size={14} className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative group mx-2 sm:mx-0">
              <div className="absolute -inset-2 sm:-inset-3 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 dark:from-indigo-500/30 dark:via-purple-500/30 dark:to-pink-500/30 rounded-[2.5rem] blur-xl sm:blur-2xl opacity-0 group-focus-within:opacity-100 transition duration-700"></div>
              <div className="relative flex items-end bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[1.5rem] sm:rounded-[2rem] shadow-xl focus-within:shadow-2xl transition-all overflow-hidden p-1.5 sm:p-2">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="mr-1 sm:mr-2 mb-0.5 shrink-0 text-zinc-400 dark:text-zinc-500 p-2 sm:p-3 rounded-full hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
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
                  placeholder={
                    mode === 'research' ? "Enter a topic to research..." :
                    mode === 'detector' ? "Paste text to detect AI..." :
                    mode === 'humanizer' ? "Paste text to humanize..." :
                    "Message Veltrxy..."
                  }
                  className="w-full max-h-32 sm:max-h-40 min-h-[44px] sm:min-h-[52px] bg-transparent border-none focus:outline-none resize-none py-2.5 sm:py-3.5 text-[15px] sm:text-[16px] font-medium text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 leading-relaxed"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && attachments.length === 0) || isLoading}
                  className="ml-1 sm:ml-2 shrink-0 bg-indigo-600 dark:bg-indigo-500 text-white p-2.5 sm:p-3 rounded-[1.2rem] hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-all disabled:opacity-30 disabled:hover:bg-indigo-600 dark:disabled:hover:bg-indigo-500 shadow-md flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 self-end mb-0.5"
                >
                  <Send className={clsx("w-4 h-4 sm:w-5 sm:h-5", isLoading ? 'animate-pulse' : '')} strokeWidth={2.5} />
                </button>
              </div>
            </div>
            <p className="text-center text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-500 mt-3 font-medium tracking-wide">
              VELTRXY AI CAN MAKE MISTAKES. VERIFY IMPORTANT DATA.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
