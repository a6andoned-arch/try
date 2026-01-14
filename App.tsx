import React, { useState, useEffect } from 'react';
import { AppMode } from './types';
import { ChatInterface } from './components/ChatInterface';
import { LiveInterface } from './components/LiveInterface';
import { ImageGenInterface } from './components/ImageGenInterface';
import { MessageSquare, Mic, Image as ImageIcon, Menu, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.CHAT);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [hasKey, setHasKey] = useState(true);

  useEffect(() => {
    // Check if API_KEY exists
    if (!process.env.API_KEY) {
      setHasKey(false);
    }
  }, []);

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-screen bg-nexus-900 text-gray-100 overflow-hidden font-sans">
      
      {!hasKey && (
        <div className="fixed top-0 inset-x-0 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 z-[60] flex items-center justify-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest">
          <AlertCircle size={14} />
          <span>No API Key Detected. Set API_KEY in your environment variables.</span>
        </div>
      )}

      {/* Mobile Header */}
      <div className={`md:hidden fixed top-0 left-0 right-0 h-16 bg-nexus-800/80 backdrop-blur-md border-b border-nexus-700 flex items-center justify-between px-4 z-50 transition-transform ${!hasKey ? 'translate-y-8' : ''}`}>
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-lg shadow-lg"></div>
            <span className="font-black text-lg tracking-tighter">NEXUS</span>
        </div>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-400">
            <Menu size={24} />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <div className={`
        fixed inset-y-0 left-0 w-72 bg-nexus-900 border-r border-white/5 transform transition-transform duration-500 z-40
        md:relative md:translate-x-0 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 hidden md:flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl shadow-2xl shadow-blue-500/40 flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
            </div>
            <div className="flex flex-col">
              <h1 className="font-black text-2xl tracking-tighter leading-none">NEXUS</h1>
              <span className="text-[10px] text-nexus-glow font-bold tracking-[0.2em] opacity-80 uppercase mt-1">Intelligence</span>
            </div>
        </div>

        <nav className="px-6 space-y-3">
            <NavButton 
                active={mode === AppMode.CHAT} 
                onClick={() => handleModeChange(AppMode.CHAT)}
                icon={<MessageSquare size={20} />}
                label="Neural Chat"
            />
            <NavButton 
                active={mode === AppMode.LIVE} 
                onClick={() => handleModeChange(AppMode.LIVE)}
                icon={<Mic size={20} />}
                label="Live Stream"
                badge="Active"
            />
            <NavButton 
                active={mode === AppMode.IMAGE_GEN} 
                onClick={() => handleModeChange(AppMode.IMAGE_GEN)}
                icon={<ImageIcon size={20} />}
                label="Visual Lab"
            />
        </nav>

        <div className="absolute bottom-8 left-0 right-0 px-8">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] text-gray-500 font-medium tracking-tight">
            <p className="mb-1 uppercase opacity-50">Engine Status</p>
            <div className="flex items-center gap-2 text-nexus-glow">
              <div className="w-1.5 h-1.5 rounded-full bg-nexus-glow animate-pulse"></div>
              <span>Gemini 3 Flash Connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className={`flex-1 h-full relative overflow-hidden transition-all ${!hasKey ? 'pt-24 md:pt-8' : 'pt-16 md:pt-0'}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.08),transparent_50%)] pointer-events-none"></div>
        {mode === AppMode.CHAT && <ChatInterface />}
        {mode === AppMode.LIVE && <LiveInterface />}
        {mode === AppMode.IMAGE_GEN && <ImageGenInterface />}
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-30 md:hidden transition-all"
            onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

interface NavButtonProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    badge?: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label, badge }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group ${
            active 
            ? 'bg-nexus-accent text-white shadow-xl shadow-blue-500/20' 
            : 'text-gray-500 hover:bg-white/5 hover:text-white'
        }`}
    >
        <span className={`${active ? 'text-white' : 'group-hover:text-nexus-glow transition-colors'}`}>
          {icon}
        </span>
        <span className="font-semibold tracking-tight">{label}</span>
        {badge && (
            <span className="ml-auto text-[9px] font-black uppercase tracking-widest bg-white/10 text-nexus-glow px-2 py-1 rounded-lg border border-white/5">
                {badge}
            </span>
        )}
    </button>
);

export default App;
