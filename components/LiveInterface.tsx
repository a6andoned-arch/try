import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Radio, Volume2 } from 'lucide-react';
import { connectLiveSession } from '../services/geminiService';

export const LiveInterface: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0); // Visualizer value 0-100
  
  // Refs for cleanup and data handling
  const sessionRef = useRef<{
    sendAudio: (data: Float32Array) => void;
    disconnect: () => void;
  } | null>(null);
  
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const toggleConnection = async () => {
    if (isConnected) {
      handleDisconnect();
    } else {
      await handleConnect();
    }
  };

  const handleConnect = async () => {
    setError(null);
    try {
        // 1. Get User Media
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // 2. Setup Audio Processing for sending to API
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        audioContextRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        sourceRef.current = source;
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(ctx.destination);

        // 3. Connect to Gemini Live
        const session = await connectLiveSession({
            onAudioData: (buffer) => {
                // Visualize output volume roughly
                const data = buffer.getChannelData(0);
                let sum = 0;
                for (let i = 0; i < data.length; i += 100) { 
                    sum += Math.abs(data[i]);
                }
                const avg = sum / (data.length / 100);
                setVolume(Math.min(100, avg * 500));
            },
            onClose: () => setIsConnected(false),
            onError: (err) => {
                console.error(err);
                setError("Connection error. Check API key and permissions.");
                setIsConnected(false);
            }
        });

        sessionRef.current = session;

        // 4. Send audio data
        processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            session.sendAudio(inputData);
            
            // Visualize input volume
            let sum = 0;
            for(let i=0; i < inputData.length; i+=100) sum += Math.abs(inputData[i]);
            setVolume(Math.min(100, (sum / (inputData.length/100)) * 500));
        };

        setIsConnected(true);

    } catch (err: any) {
        console.error("Failed to start live session", err);
        setError(err.message || "Failed to access microphone or connect.");
    }
  };

  const handleDisconnect = () => {
    sessionRef.current?.disconnect();
    
    // Cleanup Audio Nodes
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    audioContextRef.current?.close();
    
    // Stop tracks
    streamRef.current?.getTracks().forEach(track => track.stop());
    
    setIsConnected(false);
    setVolume(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        if (isConnected) handleDisconnect();
    }
  }, [isConnected]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-nexus-900 text-white p-6 relative overflow-hidden">
      
      {/* Background Ambient Effect */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-nexus-accent/20 rounded-full blur-[100px] transition-all duration-1000 ${isConnected ? 'scale-150 opacity-50' : 'scale-100 opacity-20'}`}></div>

      <div className="z-10 flex flex-col items-center gap-8">
        <h2 className="text-3xl font-light tracking-wider text-nexus-glow">GEMINI LIVE</h2>
        
        <div className="relative">
             {/* Visualizer Ring */}
             <div 
                className={`w-48 h-48 rounded-full border-4 flex items-center justify-center transition-all duration-100 ${
                    isConnected ? 'border-nexus-glow shadow-[0_0_50px_rgba(96,165,250,0.5)]' : 'border-gray-700'
                }`}
                style={{
                    transform: `scale(${1 + (volume / 200)})` 
                }}
             >
                <div className={`w-40 h-40 rounded-full bg-nexus-800 flex items-center justify-center relative overflow-hidden`}>
                     {isConnected ? (
                        <div className="flex items-end justify-center gap-1 h-1/2 pb-10">
                            {[1,2,3,4,5].map(i => (
                                <div 
                                    key={i} 
                                    className="w-2 bg-nexus-accent rounded-full animate-sound-wave" 
                                    style={{ 
                                        height: `${20 + Math.random() * volume}%`,
                                        animationDelay: `${i * 0.1}s` 
                                    }} 
                                />
                            ))}
                        </div>
                     ) : (
                         <Radio size={48} className="text-gray-600" />
                     )}
                </div>
             </div>
             
             {/* Status Badge */}
             <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${isConnected ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}>
                {isConnected ? 'Live' : 'Offline'}
             </div>
        </div>

        <div className="text-center space-y-2 max-w-md">
            <p className="text-gray-400">
                {isConnected 
                    ? "Listening... Speak naturally." 
                    : "Tap the microphone to start a real-time voice conversation."}
            </p>
            {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        <button
            onClick={toggleConnection}
            className={`p-6 rounded-full transition-all duration-300 transform hover:scale-105 ${
                isConnected 
                ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 ring-2 ring-red-500/50' 
                : 'bg-nexus-accent text-white hover:bg-blue-600 shadow-lg shadow-blue-500/30'
            }`}
        >
            {isConnected ? <MicOff size={32} /> : <Mic size={32} />}
        </button>
      </div>
    </div>
  );
};
