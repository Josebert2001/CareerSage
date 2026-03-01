
import React, { useState, useEffect } from 'react';
import { ArrowRight, Compass } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

const HOOKS = [
  "You passed WAEC. Now what?",
  "Your parents want medicine. You want design. Who do you listen to?",
  "NYSC is over. 200 CVs sent. Nothing back.",
  "You got into poly. Everyone says it's not the same as uni. Is that true?",
  "You want to study abroad but don't know where to start.",
  "Everyone around you seems to have a plan. You don't. That's okay."
];

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const [hookIndex, setHookIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setHookIndex((prev) => (prev + 1) % HOOKS.length);
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
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 animate-fadeIn relative pt-8 md:pt-16">
      <div className="text-center max-w-4xl mx-auto mb-12 md:mb-16">
        {/* Dynamic Hook with better animation */}
        <div className="h-8 md:h-10 mb-8 md:mb-12 overflow-hidden">
          <p className="text-emerald-700 font-semibold text-base md:text-lg transition-all duration-500 transform translate-y-0 line-clamp-1">
            {HOOKS[hookIndex]}
          </p>
        </div>
        
        {/* Enhanced Main Heading */}
        <h1 className="text-4xl md:text-7xl font-black text-slate-900 mb-6 md:mb-8 tracking-tight leading-snug" role="heading" aria-level={1}>
          Someone should have told you <br className="hidden md:block"/>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">this years ago.</span>
        </h1>
        
        {/* Subheading with improved contrast */}
        <p className="text-lg md:text-xl text-slate-700 leading-relaxed max-w-2xl mx-auto mb-10 md:mb-14 font-medium">
          CareerSage is the career counselor most Nigerian students never had access to.
        </p>

        {/* CTA Section */}
        <div className="flex flex-col items-center gap-6 md:gap-8">
            <button 
                onClick={handleStart}
                className="group relative inline-flex items-center gap-3 px-8 md:px-10 py-4 md:py-5 bg-emerald-900 hover:bg-emerald-800 text-white rounded-full font-bold text-base md:text-lg shadow-lg shadow-emerald-900/20 hover:shadow-xl hover:shadow-emerald-900/30 transition-all transform hover:-translate-y-1 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                aria-label="Start career guidance by telling your situation"
            >
                <span>Tell me your situation</span>
                <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
            </button>
            
            {/* Supporting text */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs md:text-sm font-semibold text-emerald-900/70 uppercase tracking-widest">
                Built by someone who grew up in this system
              </p>
            </div>
        </div>
      </div>

      {/* Feature pills section */}
      <div className="flex flex-wrap justify-center gap-3 md:gap-4 w-full max-w-5xl">
        <div className="px-4 md:px-6 py-2.5 md:py-3 rounded-full bg-white/70 backdrop-blur-sm border border-emerald-100 text-emerald-800 text-xs md:text-sm font-semibold flex items-center gap-2 transition-all hover:bg-white hover:shadow-md">
          <Compass className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          JAMB & WAEC Guidance
        </div>
        <div className="px-4 md:px-6 py-2.5 md:py-3 rounded-full bg-white/70 backdrop-blur-sm border border-emerald-100 text-emerald-800 text-xs md:text-sm font-semibold flex items-center gap-2 transition-all hover:bg-white hover:shadow-md">
          <Compass className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          NYSC & Job Market
        </div>
        <div className="px-4 md:px-6 py-2.5 md:py-3 rounded-full bg-white/70 backdrop-blur-sm border border-emerald-100 text-emerald-800 text-xs md:text-sm font-semibold flex items-center gap-2 transition-all hover:bg-white hover:shadow-md">
          <Compass className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          Poly vs Uni Reality
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
