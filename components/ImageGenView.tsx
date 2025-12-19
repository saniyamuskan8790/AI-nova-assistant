
import React, { useState } from 'react';
import { Sparkles, Download, RefreshCw, Layers, Crop, Send, Loader2, Image as ImageIcon } from 'lucide-react';
import { generateImage } from '../services/gemini';

const ImageGenView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16">("1:1");
  const [generating, setGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setResultImage(null);
    try {
      const img = await generateImage(prompt, aspectRatio);
      setResultImage(img);
    } catch (error) {
      console.error(error);
      alert("Failed to generate image. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `nova-ai-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0f172a] overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto w-full p-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="text-cyan-400" />
            Image Studio
          </h1>
          <p className="text-slate-400">Describe what you imagine, and Nova will bring it to life using Gemini 2.5 Flash.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="md:col-span-1 space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Crop size={16} /> Aspect Ratio
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["1:1", "16:9", "9:16"] as const).map(ratio => (
                  <button 
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`p-2 text-xs rounded-lg border transition-all ${aspectRatio === ratio ? 'bg-cyan-600/20 border-cyan-500 text-cyan-400' : 'border-slate-800 text-slate-500 hover:border-slate-700'}`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Layers size={16} /> Suggestions
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "Cyberpunk city at night",
                  "Vibrant oil painting of a forest",
                  "Minimalist logo for a tech brand",
                  "Hyper-realistic portrait of an astronaut"
                ].map(s => (
                  <button 
                    key={s}
                    onClick={() => setPrompt(s)}
                    className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 transition-colors text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Area */}
          <div className="md:col-span-2 space-y-4">
            <div className="relative group">
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A futuristic solarpunk library with floating books and warm sunlight..."
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 min-h-[120px] focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all resize-none text-slate-200"
              />
              <button 
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="absolute bottom-4 right-4 bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>

            {/* Result */}
            <div className={`
              relative w-full rounded-2xl border-2 border-dashed border-slate-800 flex items-center justify-center overflow-hidden
              ${aspectRatio === '1:1' ? 'aspect-square' : aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]'}
              bg-slate-900/50 transition-all
            `}>
              {generating ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                    <Sparkles className="absolute inset-0 m-auto text-cyan-400 animate-pulse" size={24} />
                  </div>
                  <p className="text-cyan-400 font-medium animate-pulse">Forging pixels...</p>
                </div>
              ) : resultImage ? (
                <div className="group w-full h-full relative">
                  <img src={resultImage} alt="Generated result" className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button 
                      onClick={handleDownload}
                      className="p-3 bg-white text-slate-900 rounded-full hover:scale-110 transition-transform"
                      title="Download Image"
                    >
                      <Download size={24} />
                    </button>
                    <button 
                      onClick={handleGenerate}
                      className="p-3 bg-cyan-600 text-white rounded-full hover:scale-110 transition-transform"
                      title="Generate Again"
                    >
                      <RefreshCw size={24} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-600">
                  <ImageIcon size={48} strokeWidth={1} />
                  <p className="text-sm">Your generation will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGenView;
