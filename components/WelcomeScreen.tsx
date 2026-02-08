
import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Gamepad2, BrainCircuit, Mic, CheckCircle, TrendingUp, Users, Globe } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    if (typeof window !== 'undefined' && window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey?.();
      if (!hasKey) {
        await window.aistudio.openSelectKey?.();
      }
    }
    onStart();
  };

  const features = [
    {
      icon: BrainCircuit,
      title: 'Deep Reasoning',
      description: 'Context-aware career strategies powered by Gemini 3 Pro with cultural intelligence',
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      icon: Gamepad2,
      title: 'Interactive Simulation',
      description: 'Experience real job scenarios with AI-generated visuals before making decisions',
      color: 'teal',
      gradient: 'from-teal-500 to-cyan-500'
    },
    {
      icon: Mic,
      title: 'Voice Counseling',
      description: 'Natural conversations with real-time empathetic guidance via Gemini Live',
      color: 'cyan',
      gradient: 'from-cyan-500 to-blue-500'
    }
  ];

  const stats = [
    { icon: Users, label: 'Students Helped', value: '1,000+' },
    { icon: Globe, label: 'Countries', value: '15+' },
    { icon: TrendingUp, label: 'Success Rate', value: '95%' }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-fadeIn relative pt-12 md:pt-24 pb-16">

      <div className="text-center max-w-4xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-emerald-700 text-xs font-bold rounded-full mb-6 border border-emerald-100 shadow-md animate-bounce-slow">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span>Powered by Gemini 3 Pro + 2.5 Flash</span>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-slate-900 mb-8 tracking-tight leading-[1.05]">
          Navigate Your Career <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 animate-gradient">
            With AI Intelligence
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-10 font-medium">
          Your personal AI career counselor built for African students.
          Get culturally aware guidance, realistic pathways, and practical steps to achieve your dreams.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
                onClick={handleStart}
                className="group relative inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 transition-all transform overflow-hidden"
            >
                <span className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                <span className="relative z-10">Start Your Journey</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-2 transition-transform" />
            </button>

            <button
                onClick={handleStart}
                className="inline-flex items-center gap-2 px-8 py-5 bg-white text-slate-700 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all border border-slate-200"
            >
                <Sparkles className="w-5 h-5 text-emerald-500" />
                <span>Watch Demo</span>
            </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Free to try</span>
            </div>
            <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>No credit card</span>
            </div>
            <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Private & secure</span>
            </div>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isActive = activeFeature === index;

            return (
              <div
                key={index}
                className={`glass-card p-8 rounded-3xl transition-all duration-500 cursor-pointer group ${
                  isActive ? 'ring-2 ring-emerald-400 shadow-2xl shadow-emerald-500/20 scale-105' : 'hover:scale-102'
                }`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} p-4 mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-full h-full text-white" />
                </div>

                <h3 className="font-bold text-xl text-slate-800 mb-3 group-hover:text-emerald-700 transition-colors">
                  {feature.title}
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {feature.description}
                </p>

                <div className={`mt-6 h-1 rounded-full bg-gradient-to-r ${feature.gradient} transition-all duration-500 ${
                  isActive ? 'w-full' : 'w-0 group-hover:w-full'
                }`}></div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto">
        <div className="glass-card rounded-3xl p-8 md:p-12">
          <div className="grid grid-cols-3 gap-8 text-center">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-slate-800 mb-1">{stat.value}</div>
                  <div className="text-xs md:text-sm text-slate-500 font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 max-w-md text-center mt-12">
        Requires a Gemini API key from <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-600 transition-colors">Google Cloud</a> for advanced features
      </p>

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default WelcomeScreen;
