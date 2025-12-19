
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, Bot, AlertCircle, Loader2 } from 'lucide-react';
import { getGeminiClient, decodeAudioData, encodeBase64, decodeBase64 } from '../services/gemini';
import { Modality, LiveServerMessage } from '@google/genai';

const VoiceView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<{role: string, text: string}[]>([]);

  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current = null; // Client side cleanup
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    for (const source of sourcesRef.current) {
      source.stop();
    }
    sourcesRef.current.clear();
    setIsActive(false);
    setStatus('idle');
  }, []);

  const startSession = async () => {
    setStatus('connecting');
    setError(null);
    try {
      const ai = getGeminiClient();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      inputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setStatus('listening');
            
            const source = inputAudioCtxRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioCtxRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const base64 = encodeBase64(new Uint8Array(int16.buffer));
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({ 
                  media: { data: base64, mimeType: 'audio/pcm;rate=16000' } 
                });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioCtxRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              setStatus('speaking');
              const base64 = msg.serverContent.modelTurn.parts[0].inlineData.data;
              const bytes = decodeBase64(base64);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioCtxRef.current!.currentTime);
              const buffer = await decodeAudioData(bytes, outputAudioCtxRef.current!, 24000, 1);
              const source = outputAudioCtxRef.current!.createBufferSource();
              source.buffer = buffer;
              source.connect(outputAudioCtxRef.current!.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setStatus('listening');
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (msg.serverContent?.interrupted) {
              for (const s of sourcesRef.current) s.stop();
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            if (msg.serverContent?.inputTranscription) {
               const text = msg.serverContent.inputTranscription.text;
               setTranscript(prev => [...prev.slice(-10), {role: 'user', text}]);
            }
            if (msg.serverContent?.outputTranscription) {
               const text = msg.serverContent.outputTranscription.text;
               setTranscript(prev => [...prev.slice(-10), {role: 'model', text}]);
            }
          },
          onerror: (e) => {
            console.error(e);
            setError("Voice connection error. Please refresh and try again.");
            stopSession();
          },
          onclose: () => {
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: "You are Nova, a helpful AI in a real-time conversation. Keep your responses natural and conversational. Avoid very long monologues."
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setError("Could not access microphone or connect to service.");
      setStatus('idle');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f172a] items-center justify-center p-6">
      <div className="max-w-md w-full flex flex-col items-center gap-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Real-time Voice</h2>
          <p className="text-slate-400">Speak naturally with Nova. Low-latency, human-like voice interaction powered by Gemini.</p>
        </div>

        {/* Visualizer Circle */}
        <div className="relative flex items-center justify-center">
          <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 bg-gradient-to-r from-rose-500 to-violet-500 transition-all duration-500 ${status === 'speaking' || status === 'listening' ? 'scale-150 animate-pulse' : 'scale-100'}`} />
          
          <div className={`
            w-48 h-48 rounded-full border-4 flex items-center justify-center transition-all duration-500 relative z-10
            ${status === 'speaking' ? 'border-rose-500 scale-105 shadow-2xl shadow-rose-900/40' : 
              status === 'listening' ? 'border-violet-500 shadow-2xl shadow-violet-900/40' : 
              'border-slate-800'}
          `}>
            {status === 'speaking' ? (
              <Volume2 size={64} className="text-rose-400 animate-bounce" />
            ) : status === 'listening' ? (
              <Mic size={64} className="text-violet-400 animate-pulse" />
            ) : status === 'connecting' ? (
              <Loader2 size={64} className="text-slate-400 animate-spin" />
            ) : (
              <Bot size={64} className="text-slate-600" />
            )}
          </div>
        </div>

        <div className="w-full space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-900/30 border border-rose-500/30 text-rose-200 rounded-xl text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button 
            onClick={isActive ? stopSession : startSession}
            disabled={status === 'connecting'}
            className={`
              w-full p-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all
              ${isActive ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-gradient-to-r from-rose-500 to-violet-600 hover:opacity-90 text-white shadow-xl'}
            `}
          >
            {isActive ? (
              <>
                <MicOff size={24} />
                <span>End Conversation</span>
              </>
            ) : status === 'connecting' ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Mic size={24} />
                <span>Start Talking</span>
              </>
            )}
          </button>
        </div>

        {/* Live Transcript Snippets */}
        <div className="w-full h-24 overflow-hidden relative">
          <div className="absolute inset-x-0 bottom-0 space-y-2 opacity-60">
            {transcript.map((t, i) => (
              <div key={i} className={`text-xs ${t.role === 'user' ? 'text-violet-400' : 'text-slate-300'}`}>
                <span className="font-bold mr-2 uppercase tracking-tight">{t.role}:</span>
                {t.text}
              </div>
            ))}
          </div>
          <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#0f172a] to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default VoiceView;
