
import React, { useState, useEffect } from 'react';
import { ArrowRight, GraduationCap, Briefcase, Building2 } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const [hookIndex, setHookIndex] = useState(0);
  const hooks = [
    "You passed WAEC. Now what?",
    "Your parents want medicine. You want design. Who do you listen to?",
    "NYSC is over. 200 CVs sent. Nothing back.",
    "You got into poly. Everyone says it's not the same as uni. Is that true?",
    "You want to study abroad but don't know where to start.",
    "Everyone around you seems to have a plan. You don't. That's okay."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setHookIndex((prev) => (prev + 1) % hooks.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
    }
    onStart();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 animate-fadeIn relative pt-12 md:pt-20">
      <div className="text-center max-w-4xl mx-auto mb-16">
        <div className="h-12 mb-8 overflow-hidden">
          <p key={hookIndex} className="text-emerald-700 font-medium text-lg md:text-xl animate-fadeIn">
            {hooks[hookIndex]}
          </p>
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black text-slate-900 mb-8 tracking-tight leading-[0.95]">
          Someone should have told you <br className="hidden md:block"/>
          <span className="text-emerald-800">this years ago.</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-600 leading-relaxed max-w-2xl mx-auto mb-12 font-medium">
          CareerSage is the career counselor most Nigerian students never had access to.
        </p>

        <div className="flex flex-col items-center gap-6">
            <button 
                onClick={handleStart}
                className="group relative inline-flex items-center gap-4 px-10 py-5 bg-emerald-900 text-white rounded-full font-bold text-xl shadow-2xl hover:bg-emerald-800 transition-all transform hover:-translate-y-1 active:scale-95"
            >
                <span>Tell me your situation</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-bold text-emerald-900/60 uppercase tracking-widest">
                Built by someone who grew up in this system.
              </p>
              <p className="text-xs text-slate-500 max-w-sm text-center">
                A paid API key from <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-emerald-700">Google Cloud</a> is required for high-fidelity features.
              </p>
            </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 w-full max-w-5xl opacity-80">
        <div className="px-6 py-3 rounded-full bg-white/50 border border-emerald-100 text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <GraduationCap className="w-4 h-4" />
          JAMB & WAEC Guidance
        </div>
        <div className="px-6 py-3 rounded-full bg-white/50 border border-emerald-100 text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          NYSC & Job Market
        </div>
        <div className="px-6 py-3 rounded-full bg-white/50 border border-emerald-100 text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Poly vs Uni Reality
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
