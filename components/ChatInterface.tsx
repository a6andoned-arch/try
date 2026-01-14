import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { Send, Image as ImageIcon, Loader2, X } from 'lucide-react';

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm Gemini Nexus. I can help you with text analysis, coding, or analyzing images. How can I help today?",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      image: selectedImage || undefined,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(messages, input, userMsg.image);
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Sorry, I encountered an error connecting to Gemini.",
        isError: true,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-nexus-900 text-gray-100">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-4 ${
                msg.role === 'user'
                  ? 'bg-nexus-accent text-white rounded-br-none'
                  : 'bg-nexus-800 text-gray-200 rounded-bl-none border border-nexus-700'
              } shadow-lg`}
            >
              {msg.image && (
                <img 
                  src={msg.image} 
                  alt="User uploaded" 
                  className="mb-3 max-h-64 rounded-lg border border-white/20"
                />
              )}
              <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-nexus-800 p-4 rounded-2xl rounded-bl-none border border-nexus-700 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-nexus-glow" />
                <span className="text-gray-400 text-sm">Thinking...</span>
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-nexus-800 border-t border-nexus-700">
        {selectedImage && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-nexus-900 rounded-lg w-fit border border-nexus-700">
                <span className="text-xs text-gray-400">Image attached</span>
                <button onClick={() => setSelectedImage(null)} className="text-gray-400 hover:text-red-400">
                    <X size={14} />
                </button>
            </div>
        )}
        <div className="flex gap-2 items-end max-w-4xl mx-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-400 hover:text-nexus-glow hover:bg-nexus-700 rounded-xl transition-colors"
            title="Upload Image"
          >
            <ImageIcon size={20} />
          </button>
          
          <div className="flex-1 relative">
             <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                placeholder="Ask anything..."
                className="w-full bg-nexus-900 border-nexus-700 text-gray-100 rounded-xl border p-3 pr-10 focus:ring-2 focus:ring-nexus-accent focus:border-transparent resize-none h-[50px] max-h-[150px] scrollbar-hide"
             />
          </div>

          <button
            onClick={handleSend}
            disabled={(!input && !selectedImage) || isLoading}
            className="p-3 bg-nexus-accent hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg shadow-blue-500/20"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};
