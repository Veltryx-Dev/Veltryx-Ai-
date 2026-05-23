import React from 'react';
import { Plus, MessageSquare, Trash2, Settings, X } from 'lucide-react';
import { ChatSession } from '../types';
import clsx from 'clsx';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onNewSession, 
  onDeleteSession,
  isOpen,
  onToggle
}: SidebarProps) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar Container */}
      <div 
        className={clsx(
          "fixed lg:static inset-y-0 left-0 z-30 bg-white/40 dark:bg-[#020617]/40 backdrop-blur-3xl border-r border-white/20 dark:border-white/5 flex flex-col transition-all duration-300 ease-in-out shrink-0 overflow-hidden",
          isOpen ? "translate-x-0 w-72 opacity-100" : "-translate-x-full w-72 lg:w-0 lg:border-r-0 lg:-translate-x-10 lg:opacity-0"
        )}
      >
        <div className="px-4 sm:px-5 pt-5 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onNewSession();
                if (window.innerWidth < 1024) onToggle();
              }}
              className="flex-1 flex items-center justify-between px-4 py-3 bg-white/60 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-100 font-semibold rounded-[1rem] hover:bg-white dark:hover:bg-zinc-800/60 border border-white/60 dark:border-white/10 transition-all duration-300 shadow-sm hover:shadow-md group"
            >
              <span className="flex items-center gap-2">
                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                New Chat
              </span>
            </button>
            <button
              onClick={onToggle}
              className="p-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white/60 dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-800/60 border border-white/60 dark:border-white/10 rounded-[1rem] transition-all duration-300 shadow-sm flex-shrink-0"
              title="Close Sidebar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-3 pb-3 pt-2">
          <button
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-white/50 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl transition-colors"
          >
            <Settings size={18} className="opacity-70" />
            Settings
          </button>
        </div>

        <div className="px-5 pb-2 pt-2">
          <span className="text-[10px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">History</span>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center text-zinc-500 py-8 px-4 text-sm font-medium">
              No previous conversations
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={clsx(
                  "group relative w-full flex items-center gap-3 px-3 py-3 rounded-2xl cursor-pointer transition-all duration-300",
                  session.id === currentSessionId
                    ? "bg-white/80 dark:bg-white/10 text-zinc-900 dark:text-white shadow-sm border border-white/60 dark:border-white/5"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-zinc-200 border border-transparent"
                )}
                onClick={() => {
                  onSelectSession(session.id);
                  if (window.innerWidth < 1024) onToggle();
                }}
              >
                <MessageSquare size={16} className="shrink-0 opacity-70" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {session.title || 'New Conversation'}
                  </p>
                  <p className={clsx("text-[10px] font-medium truncate mt-0.5", session.id === currentSessionId ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-500")}>
                    {session.updatedAt ? new Date(session.updatedAt).toLocaleDateString(undefined, { 
                      month: 'short', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    }) : 'Recent'}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 shrink-0 p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-400/10 rounded-lg transition-all"
                  title="Delete Chat"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
