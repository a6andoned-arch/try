import React, { useState } from 'react';
import { AppMode } from './types';
import { ChatInterface } from './components/ChatInterface';
import { LiveInterface } from './components/LiveInterface';
import { ImageGenInterface } from './components/ImageGenInterface';
import { MessageSquare, Mic, Image as ImageIcon, Menu, Github } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.CHAT);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on mobile when mode changes
  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-screen bg-nexus-900 text-gray-100 overflow-hidden">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-nexus-800 border-b border-nexus-700 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-lg"></div>
            <span className="font-bold text-lg tracking-tight">Gemini Nexus</span>
        </div>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2">
            <Menu size={24} />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <div className={`
        fixed inset-y-0 left-0 w-64 bg-nexus-800 border-r border-nexus-700 transform transition-transform duration-300 z-40
        md:relative md:translate-x-0 pt-20 md:pt-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 hidden md:flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-lg shadow-lg shadow-blue-500/20"></div>
            <h1 className="font-bold text-xl tracking-tight text-white">Gemini Nexus</h1>
        </div>

        <nav className="px-4 space-y-2">
            <NavButton 
                active={mode === AppMode.CHAT} 
                onClick={() => handleModeChange(AppMode.CHAT)}
                icon={<MessageSquare size={20} />}
                label="Chat Assistant"
            />
            <NavButton 
                active={mode === AppMode.LIVE} 
                onClick={() => handleModeChange(AppMode.LIVE)}
                icon={<Mic size={20} />}
                label="Live Voice"
                badge="New"
            />
            <NavButton 
                active={mode === AppMode.IMAGE_GEN} 
                onClick={() => handleModeChange(AppMode.IMAGE_GEN)}
                icon={<ImageIcon size={20} />}
                label="Image Studio"
            />
        </nav>

        <div className="absolute bottom-6 left-0 right-0 px-6 text-xs text-gray-500 text-center">
            <p>Powered by Google Gemini API</p>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 h-full pt-16 md:pt-0 relative overflow-hidden">
        {mode === AppMode.CHAT && <ChatInterface />}
        {mode === AppMode.LIVE && <LiveInterface />}
        {mode === AppMode.IMAGE_GEN && <ImageGenInterface />}
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
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
        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
            active 
            ? 'bg-nexus-accent text-white shadow-lg shadow-blue-500/25' 
            : 'text-gray-400 hover:bg-nexus-700 hover:text-gray-100'
        }`}
    >
        {icon}
        <span className="font-medium">{label}</span>
        {badge && (
            <span className="ml-auto text-[10px] font-bold uppercase tracking-wider bg-nexus-glow text-nexus-900 px-2 py-0.5 rounded-full">
                {badge}
            </span>
        )}
    </button>
);

export default App;
