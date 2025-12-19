
import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Globe, User, Bot, ExternalLink, Loader2 } from 'lucide-react';
import { ChatSession, Message, GroundingSource } from '../types';
import { chatWithGemini } from '../services/gemini';

interface ChatViewProps {
  session: ChatSession | null;
  onUpdateMessages: (messages: Message[]) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ session, onUpdateMessages }) => {
  const [input, setInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.messages, loading]);

  const handleSend = async () => {
    if (!input.trim() && !selectedImage) return;
    if (!session) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      image: selectedImage || undefined
    };

    const newMessages = [...session.messages, userMessage];
    onUpdateMessages(newMessages);
    setInput('');
    setSelectedImage(null);
    setLoading(true);

    try {
      const chatHistory = newMessages.map(m => ({
        role: m.role,
        content: m.content,
        image: m.image
      }));

      const response = await chatWithGemini(chatHistory, isSearching);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || "Sorry, I couldn't generate a response.",
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
          title: chunk.web?.title || 'Source',
          uri: chunk.web?.uri || ''
        })).filter((s: any) => s.uri) as GroundingSource[]
      };

      onUpdateMessages([...newMessages, assistantMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: "An error occurred while connecting to Nova's brain. Please try again."
      };
      onUpdateMessages([...newMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!session) return (
    <div className="flex-1 flex items-center justify-center text-slate-500">
      Select or create a chat to begin.
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f172a] relative">
      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 pb-32"
      >
        {session.messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-600 flex items-center justify-center shadow-2xl shadow-violet-900/40">
              <Bot size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold">Welcome to Nova AI</h2>
            <p className="text-slate-400">
              I'm your intelligent multi-modal assistant. I can write code, analyze images, 
              browse the web, and help you solve complex problems.
            </p>
            <div className="grid grid-cols-2 gap-3 w-full">
              {[
                "Write a React component",
                "Explain quantum physics",
                "Help with my math",
                "Summarize a paper"
              ].map(prompt => (
                <button 
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="p-3 text-sm border border-slate-800 rounded-xl hover:bg-slate-800/50 transition-colors text-slate-300"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        )}

        {session.messages.map((m) => (
          <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role !== 'user' && (
              <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${m.role === 'system' ? 'bg-rose-500' : 'bg-violet-600'}`}>
                <Bot size={18} className="text-white" />
              </div>
            )}
            <div className={`max-w-[85%] md:max-w-[70%] space-y-2 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`
                p-4 rounded-2xl whitespace-pre-wrap leading-relaxed shadow-sm
                ${m.role === 'user' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-200'}
                ${m.role === 'system' ? 'bg-rose-900/30 border border-rose-500/30 text-rose-200' : ''}
              `}>
                {m.image && (
                  <img src={m.image} alt="Uploaded" className="max-w-xs rounded-lg mb-3 border border-white/10" />
                )}
                {m.content}
              </div>
              
              {m.sources && m.sources.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {m.sources.map((source, i) => (
                    <a 
                      key={i}
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] flex items-center gap-1.5 px-2 py-1 bg-slate-800/80 border border-slate-700/50 rounded-full text-cyan-400 hover:bg-slate-700 transition-colors"
                    >
                      <Globe size={10} />
                      <span className="truncate max-w-[120px]">{source.title}</span>
                      <ExternalLink size={8} />
                    </a>
                  ))}
                </div>
              )}
            </div>
            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-lg shrink-0 bg-slate-700 flex items-center justify-center">
                <User size={18} className="text-white" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center animate-pulse">
              <Bot size={18} className="text-white" />
            </div>
            <div className="bg-slate-800 p-4 rounded-2xl flex items-center gap-3">
              <Loader2 size={18} className="animate-spin text-violet-400" />
              <span className="text-sm text-slate-400">Nova is thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent">
        <div className="max-w-4xl mx-auto flex flex-col gap-2">
          {selectedImage && (
            <div className="flex items-center gap-2 p-2 bg-slate-800 rounded-lg w-fit border border-slate-700">
              <img src={selectedImage} className="w-10 h-10 object-cover rounded" />
              <span className="text-xs text-slate-400">Image attached</span>
              <button onClick={() => setSelectedImage(null)} className="p-1 hover:text-rose-400">
                <X size={14} />
              </button>
            </div>
          )}
          
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity"></div>
            <div className="relative bg-slate-900 border border-slate-700/50 rounded-2xl flex items-end p-2 pr-3">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-violet-400 transition-colors"
                title="Upload image"
              >
                <Paperclip size={20} />
              </button>
              
              <textarea 
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message Nova Assistant..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-200 py-3 px-2 resize-none max-h-40 min-h-[48px]"
              />

              <div className="flex items-center gap-2 mb-1.5">
                <button 
                  onClick={() => setIsSearching(!isSearching)}
                  className={`p-2 rounded-lg transition-all ${isSearching ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-500 hover:text-slate-300'}`}
                  title="Toggle Web Search"
                >
                  <Globe size={18} />
                </button>
                <button 
                  onClick={handleSend}
                  disabled={loading || (!input.trim() && !selectedImage)}
                  className={`p-2 rounded-lg transition-all ${(!input.trim() && !selectedImage) ? 'text-slate-600' : 'bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-900/40'}`}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-center text-slate-500 mt-2">
            Nova can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
