import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Radio, Loader2 } from 'lucide-react';
import { connectLiveSession } from '../services/geminiService';

export const LiveInterface: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = ctx;
      
      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);

      const session = await connectLiveSession({
        onAudioData: (buffer) => {
          const data = buffer.getChannelData(0);
          let max = 0;
          for (let i = 0; i < data.length; i += 100) max = Math.max(max, Math.abs(data[i]));
          setVolume(max * 100);
        },
        onClose: () => setIsConnected(false),
        onError: (err) => {
          setError("Session failed. Ensure your API Key is valid and project billing is active.");
          setIsConnected(false);
        },
        onInterrupted: () => setVolume(0)
      });

      sessionRef.current = session;
      processor.onaudioprocess = (e) => {
        if (isConnected) session.sendAudio(e.inputBuffer.getChannelData(0));
      };

      source.connect(processor);
      processor.connect(ctx.destination);
      setIsConnected(true);
    } catch (err: any) {
      setError(err.message || "Microphone access denied.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    sessionRef.current?.disconnect();
    audioContextRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    setIsConnected(false);
    setVolume(0);
  };

  useEffect(() => {
    return () => { if (isConnected) handleDisconnect(); };
  }, [isConnected]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-nexus-900 text-white p-6 overflow-hidden">
      <div className={`absolute inset-0 bg-nexus-accent/5 pointer-events-none transition-opacity duration-1000 ${isConnected ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-nexus-accent/20 rounded-full blur-[120px] animate-pulse"></div>
      </div>

      <div className="z-10 flex flex-col items-center gap-10">
        <div className="text-center space-y-2">
            <h2 className="text-4xl font-black tracking-tighter text-white">NEXUS <span className="text-nexus-glow">LIVE</span></h2>
            <p className="text-gray-400 font-medium tracking-wide uppercase text-xs">Real-time Multimodal Voice</p>
        </div>
        
        <div className="relative group">
             <div 
                className={`w-56 h-56 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    isConnected ? 'border-nexus-glow scale-110' : 'border-white/10'
                }`}
                style={{ boxShadow: isConnected ? `0 0 ${20 + volume}px rgba(96, 165, 250, 0.4)` : 'none' }}
             >
                <div className="w-48 h-48 rounded-full bg-nexus-800 flex items-center justify-center border border-white/5">
                     {isConnected ? (
                        <div className="flex items-center gap-1.5 h-12">
                            {[1,2,3,4,5,6,7].map(i => (
                                <div 
                                    key={i} 
                                    className="w-1.5 bg-nexus-glow rounded-full transition-all duration-75" 
                                    style={{ height: `${10 + Math.random() * volume * 2}%` }} 
                                />
                            ))}
                        </div>
                     ) : (
                         <Radio size={56} className="text-white/20" />
                     )}
                </div>
             </div>
        </div>

        <div className="text-center max-w-xs h-12">
            {error ? (
                <p className="text-red-400 text-sm font-medium">{error}</p>
            ) : (
                <p className="text-gray-400 text-sm">
                    {isConnected ? "Listening for your voice..." : "Step into the future of conversation."}
                </p>
            )}
        </div>

        <button
            onClick={isConnected ? handleDisconnect : handleConnect}
            disabled={isConnecting}
            className={`group relative p-8 rounded-full transition-all duration-500 transform ${
                isConnected 
                ? 'bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20' 
                : 'bg-white text-nexus-900 hover:scale-110 shadow-[0_0_30px_rgba(255,255,255,0.2)]'
            }`}
        >
            {isConnecting ? <Loader2 className="animate-spin" size={32} /> : 
             isConnected ? <MicOff size={32} /> : <Mic size={32} />}
            
            <span className="absolute -inset-2 rounded-full border border-white/0 group-hover:border-white/20 transition-all duration-500"></span>
        </button>
      </div>
    </div>
  );
};