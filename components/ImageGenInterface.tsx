import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { Sparkles, Download, Loader2, Image as ImageIcon } from 'lucide-react';

export const ImageGenInterface: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim() || loading) return;
        setLoading(true);
        setError(null);
        try {
            const imgBase64 = await generateImage(prompt);
            setGeneratedImage(imgBase64);
        } catch (err) {
            setError("Failed to generate image. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full bg-nexus-900 p-6 flex flex-col items-center overflow-y-auto">
            <div className="w-full max-w-3xl space-y-8">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-nexus-glow to-purple-400">
                        Imagine Anything
                    </h2>
                    <p className="text-gray-400">Powered by Gemini 2.5 Flash Image</p>
                </div>

                <div className="bg-nexus-800 p-2 rounded-2xl border border-nexus-700 shadow-xl flex flex-col md:flex-row gap-2">
                    <input 
                        type="text" 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="A futuristic city on Mars, cyberpunk style, neon lights..."
                        className="flex-1 bg-transparent border-none p-4 text-white focus:ring-0 placeholder-gray-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    />
                    <button 
                        onClick={handleGenerate}
                        disabled={loading || !prompt}
                        className="bg-nexus-accent hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                        <span>Generate</span>
                    </button>
                </div>

                {error && (
                    <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl text-center">
                        {error}
                    </div>
                )}

                <div className="aspect-square w-full max-w-lg mx-auto bg-nexus-800 rounded-2xl border-2 border-dashed border-nexus-700 flex items-center justify-center relative overflow-hidden group">
                    {generatedImage ? (
                        <>
                            <img src={generatedImage} alt="Generated" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                <a 
                                    href={generatedImage} 
                                    download={`gemini-gen-${Date.now()}.png`}
                                    className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform"
                                >
                                    <Download size={24} />
                                </a>
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-gray-500 space-y-4">
                            {loading ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 border-4 border-nexus-accent border-t-transparent rounded-full animate-spin"></div>
                                    <p className="animate-pulse text-nexus-glow">Creating masterpiece...</p>
                                </div>
                            ) : (
                                <>
                                    <ImageIcon size={64} className="mx-auto opacity-50" />
                                    <p>Your imagination appears here</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}