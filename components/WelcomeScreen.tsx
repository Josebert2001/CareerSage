
import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

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
    <div className="flex flex-col items-center justify-center min-h-screen px-4 md:px-6 animate-fadeIn relative py-16 md:py-20">
      {/* Main Content */}
      <div className="w-full max-w-3xl mx-auto">
        {/* Dynamic Context Tag */}
        <div className="mb-12 md:mb-16 h-7 md:h-8 overflow-hidden">
          <p className="text-slate-500 font-normal text-base md:text-lg transition-all duration-500 transform translate-y-0">
            {HOOKS[hookIndex]}
          </p>
        </div>
        
        {/* Main Headline - Minimal and Elegant */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-slate-900 mb-8 md:mb-10 leading-tight tracking-tight" role="heading" aria-level={1}>
          Your career path, <span className="font-normal">clarified</span>
        </h1>
        
        {/* Subheading - Concise Value Prop */}
        <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mb-12 md:mb-16 font-light">
          CareerSage helps Nigerian students navigate JAMB, NYSC, and beyond with personalized guidance tailored to your unique situation.
        </p>

        {/* CTA Section - Subtle but Clear */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 md:gap-8">
          <button 
            onClick={handleStart}
            className="inline-flex items-center gap-2 px-7 md:px-8 py-3.5 md:py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-base md:text-lg transition-all transform hover:-translate-y-0.5 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700"
            aria-label="Start career guidance by telling your situation"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-0.5" />
          </button>
          
          {/* Trust indicator */}
          <p className="text-sm text-slate-500 font-light">
            Takes 5 minutes. No signup required.
          </p>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1 min-h-12"></div>

      {/* Feature Highlights - Clean and Minimal */}
      <div className="w-full max-w-3xl mx-auto pt-8 md:pt-12 border-t border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <div className="text-center md:text-left">
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-2">Educational Paths</p>
            <p className="text-slate-700 text-sm">JAMB, WAEC, NYSC guidance</p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-2">Career Planning</p>
            <p className="text-slate-700 text-sm">Personalized roadmap for your goals</p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-2">Real Context</p>
            <p className="text-slate-700 text-sm">Advice that considers your reality</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
