
import React from 'react';
import { Sparkles, ArrowRight, Zap, Mic, Gamepad2, BrainCircuit, Globe } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 animate-fadeIn relative pt-20 md:pt-32">
      
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/60 backdrop-blur-sm text-emerald-700 text-xs font-bold rounded-full mb-3 border border-white shadow-sm animate-bounce-slow">
            <Sparkles className="w-3 h-3 text-emerald-500" /> 
            <span>Powered by Google Gemini 3 Pro</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight leading-[1.1]">
          Design Your Future <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">With Intelligence</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-8">
          CareerSage is your personal AI career strategist. 
          We combine deep reasoning with local context to help you navigate 
          education, jobs, and dreams in a changing world.
        </p>

        <button 
          onClick={onStart}
          className="group relative inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-full font-bold text-lg shadow-xl shadow-emerald-900/10 hover:shadow-2xl hover:bg-slate-800 transition-all transform hover:-translate-y-1 overflow-hidden"
        >
           <span className="relative z-10">Start Your Journey</span>
           <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
           <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-0 group-hover:opacity-20 transition-opacity"></div>
        </button>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl">
        <div className="glass-card p-6 rounded-2xl border-t-4 border-t-emerald-500 hover:bg-white/90 transition-colors group">
            <div className="bg-emerald-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BrainCircuit className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">Deep Reasoning</h3>
            <p className="text-sm text-slate-600">
                Powered by Gemini 3 Pro to analyze your documents and context, creating dual-pathway strategies (Practical vs. Growth).
            </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border-t-4 border-t-indigo-500 hover:bg-white/90 transition-colors group">
            <div className="bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Gamepad2 className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">Career Simulator</h3>
            <p className="text-sm text-slate-600">
                Experience a "Day in the Life" of any job with AI-generated visuals and interactive roleplay scenarios.
            </p>
        </div>

        <div className="glass-card p-6 rounded-2xl border-t-4 border-t-rose-500 hover:bg-white/90 transition-colors group">
            <div className="bg-rose-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Mic className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">Voice Guidance</h3>
            <p className="text-sm text-slate-600">
                Talk through your fears and plans naturally with our real-time, low-latency Voice Assistant.
            </p>
        </div>
      </div>

    </div>
  );
};

export default WelcomeScreen;
