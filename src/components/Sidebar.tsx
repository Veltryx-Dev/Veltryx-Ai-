import React from 'react';
import { Plus, MessageSquare, Trash2, Calendar, Menu } from 'lucide-react';
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
          "fixed lg:static inset-y-0 left-0 z-30 w-72 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => {
              onNewSession();
              if (window.innerWidth < 1024) onToggle();
            }}
            className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 transition-colors shadow-sm"
          >
            <span className="flex items-center gap-2">
              <Plus size={18} />
              New Chat
            </span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center text-zinc-500 py-8 px-4 text-sm font-medium">
              No previous conversations
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={clsx(
                  "group relative w-full flex items-center gap-3 px-3 py-3 rounded-2xl cursor-pointer transition-all duration-200",
                  session.id === currentSessionId
                    ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200"
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
                    {new Date(session.updatedAt).toLocaleDateString(undefined, { 
                      month: 'short', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
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
