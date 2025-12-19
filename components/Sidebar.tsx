
import React from 'react';
import { Plus, Trash2, MessageSquare, Image as ImageIcon, Mic, History, Sparkles, Globe } from 'lucide-react';
import { AppMode, ChatSession } from '../types';

interface SidebarProps {
  isOpen: boolean;
  sessions: ChatSession[];
  activeId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  currentMode: AppMode;
  onSetMode: (mode: AppMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  sessions, 
  activeId, 
  onSelectSession, 
  onNewSession, 
  onDeleteSession,
  currentMode,
  onSetMode
}) => {
  return (
    <aside className={`
      fixed md:relative z-50 h-full glass border-r border-slate-800 transition-all duration-300 ease-in-out
      ${isOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full md:w-0'}
      overflow-hidden flex flex-col
    `}>
      <div className="p-4 flex flex-col gap-2">
        <button 
          onClick={onNewSession}
          className="flex items-center gap-2 w-full p-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-violet-900/20"
        >
          <Plus size={18} />
          <span>New Chat</span>
        </button>

        <div className="mt-4 flex flex-col gap-1">
          <p className="text-[10px] uppercase font-bold text-slate-500 px-2 mb-1 tracking-widest">Capabilities</p>
          <button 
            onClick={() => onSetMode(AppMode.CHAT)}
            className={`flex items-center gap-3 w-full p-2.5 rounded-lg text-sm transition-colors ${currentMode === AppMode.CHAT ? 'bg-slate-800 text-violet-400' : 'hover:bg-slate-800/50 text-slate-400'}`}
          >
            <MessageSquare size={16} />
            <span>Assistant Chat</span>
          </button>
          <button 
            onClick={() => onSetMode(AppMode.IMAGE_GEN)}
            className={`flex items-center gap-3 w-full p-2.5 rounded-lg text-sm transition-colors ${currentMode === AppMode.IMAGE_GEN ? 'bg-slate-800 text-cyan-400' : 'hover:bg-slate-800/50 text-slate-400'}`}
          >
            <ImageIcon size={16} />
            <span>Image Studio</span>
          </button>
          <button 
            onClick={() => onSetMode(AppMode.VOICE)}
            className={`flex items-center gap-3 w-full p-2.5 rounded-lg text-sm transition-colors ${currentMode === AppMode.VOICE ? 'bg-slate-800 text-rose-400' : 'hover:bg-slate-800/50 text-slate-400'}`}
          >
            <Mic size={16} />
            <span>Real-time Voice</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 flex flex-col gap-1">
        <p className="text-[10px] uppercase font-bold text-slate-500 px-3 mb-2 tracking-widest flex items-center gap-1.5">
          <History size={12} /> Recent History
        </p>
        {sessions.map(session => (
          <div 
            key={session.id}
            className={`
              group flex items-center justify-between p-2.5 rounded-lg text-sm cursor-pointer transition-all
              ${activeId === session.id ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/40 text-slate-400'}
            `}
            onClick={() => onSelectSession(session.id)}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <MessageSquare size={16} className="shrink-0 opacity-60" />
              <span className="truncate">{session.title}</span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(session.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="text-center py-10 text-slate-600 italic text-sm">
            No history yet
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-800/50 bg-slate-900/30">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
            JD
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-medium truncate">Pro User</p>
            <p className="text-[10px] text-slate-500 truncate">Nova Premium</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
