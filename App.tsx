
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MessageSquare, 
  Image as ImageIcon, 
  Mic, 
  Plus, 
  Settings, 
  Trash2, 
  Search, 
  Send,
  Paperclip,
  X,
  History,
  Menu,
  ChevronRight,
  Sparkles,
  Zap,
  Globe
} from 'lucide-react';
import { AppMode, ChatSession, Message, GroundingSource } from './types';
import ChatView from './components/ChatView';
import ImageGenView from './components/ImageGenView';
import VoiceView from './components/VoiceView';
import Sidebar from './components/Sidebar';

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.CHAT);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Load sessions from localStorage
    const saved = localStorage.getItem('nova_sessions');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSessions(parsed);
      if (parsed.length > 0) {
        setActiveSessionId(parsed[0].id);
      }
    } else {
      createNewSession();
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('nova_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now()
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    setCurrentMode(AppMode.CHAT);
    if (isMobile) setIsSidebarOpen(false);
  };

  const deleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  const updateSessionMessages = useCallback((sessionId: string, messages: Message[]) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        // Simple heuristic for title: use first message
        let title = s.title;
        if (messages.length > 0 && s.title === 'New Conversation') {
          title = messages[0].content.slice(0, 30) + (messages[0].content.length > 30 ? '...' : '');
        }
        return { ...s, messages, title };
      }
      return s;
    }));
  }, []);

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-200 overflow-hidden">
      {/* Mobile Backdrop */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen}
        sessions={sessions}
        activeId={activeSessionId}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          if (isMobile) setIsSidebarOpen(false);
        }}
        onNewSession={createNewSession}
        onDeleteSession={deleteSession}
        currentMode={currentMode}
        onSetMode={setCurrentMode}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 glass border-b border-slate-800 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
                Nova AI
              </span>
              <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">v3.0</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentMode(AppMode.CHAT)}
              className={`p-2 rounded-lg transition-all ${currentMode === AppMode.CHAT ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30' : 'hover:bg-slate-800 text-slate-400'}`}
              title="Chat Mode"
            >
              <MessageSquare size={18} />
            </button>
            <button 
              onClick={() => setCurrentMode(AppMode.IMAGE_GEN)}
              className={`p-2 rounded-lg transition-all ${currentMode === AppMode.IMAGE_GEN ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30' : 'hover:bg-slate-800 text-slate-400'}`}
              title="Image Generation"
            >
              <ImageIcon size={18} />
            </button>
            <button 
              onClick={() => setCurrentMode(AppMode.VOICE)}
              className={`p-2 rounded-lg transition-all ${currentMode === AppMode.VOICE ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30' : 'hover:bg-slate-800 text-slate-400'}`}
              title="Live Voice"
            >
              <Mic size={18} />
            </button>
          </div>
        </header>

        {/* Views */}
        <div className="flex-1 overflow-hidden">
          {currentMode === AppMode.CHAT && (
            <ChatView 
              session={activeSession} 
              onUpdateMessages={(messages) => activeSessionId && updateSessionMessages(activeSessionId, messages)}
            />
          )}
          {currentMode === AppMode.IMAGE_GEN && (
            <ImageGenView />
          )}
          {currentMode === AppMode.VOICE && (
            <VoiceView />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
