
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
    <div className="flex flex-col items-center justify-center min-h-screen px-4 md:px-6 animate-fadeIn relative py-12 md:py-20">
      {/* Glassmorphism Card Container */}
      <div className="w-full max-w-2xl mx-auto">
        {/* Main Glassmorphic Panel */}
        <div className="relative backdrop-blur-2xl bg-white/30 border border-white/40 rounded-3xl md:rounded-4xl p-8 md:p-12 lg:p-16 shadow-2xl shadow-slate-200/20 group hover:shadow-2xl hover:shadow-emerald-200/20 transition-all duration-300">
          {/* Gradient border accent */}
          <div className="absolute inset-0 rounded-3xl md:rounded-4xl bg-gradient-to-br from-emerald-300/10 via-transparent to-teal-300/10 pointer-events-none" />
          
          <div className="relative z-10 space-y-8 md:space-y-10">
            {/* Dynamic Context Tag - Glassmorphic Badge */}
            <div className="h-7 md:h-8 overflow-hidden">
              <p className="text-emerald-700 font-medium text-sm md:text-base transition-all duration-500 transform translate-y-0">
                {HOOKS[hookIndex]}
              </p>
            </div>
            
            {/* Main Headline - Bold and Clear */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight tracking-tight" role="heading" aria-level={1}>
              Navigate your career with clarity
            </h1>
            
            {/* Subheading - Vibrant and Inspiring */}
            <p className="text-lg md:text-xl text-slate-700 leading-relaxed font-light">
              Get personalized guidance for JAMB, NYSC, and beyond. CareerSage understands your reality and helps you make confident decisions.
            </p>

            {/* CTA Section - Elegant and Clear */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 pt-4">
              <button 
                onClick={handleStart}
                className="inline-flex items-center gap-2 px-7 md:px-9 py-3.5 md:py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-semibold text-base md:text-lg shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all transform hover:-translate-y-0.5 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                aria-label="Start career guidance by telling your situation"
              >
                <span>Begin Assessment</span>
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-0.5" />
              </button>
              
              {/* Trust indicator */}
              <p className="text-sm text-slate-600 font-medium">
                5 min • No signup needed
              </p>
            </div>
          </div>
        </div>

        {/* Feature Pills Below - Light Glassmorphic Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mt-8 md:mt-10">
          {[
            { label: "JAMB & WAEC", desc: "Exam guidance" },
            { label: "Career Paths", desc: "Real options" },
            { label: "Future Ready", desc: "NYSC onwards" }
          ].map((item, idx) => (
            <div
              key={idx}
              className="backdrop-blur-lg bg-white/20 border border-white/30 rounded-xl md:rounded-2xl p-4 md:p-5 hover:bg-white/30 hover:border-white/40 transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-emerald-200/10"
            >
              <p className="text-emerald-700 font-semibold text-sm md:text-base mb-1">{item.label}</p>
              <p className="text-slate-600 text-xs md:text-sm font-light">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
