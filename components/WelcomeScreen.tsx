
import React, { useState, useEffect } from 'react';
import { ArrowRight, GraduationCap, Briefcase, Building2, Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const [hookIndex, setHookIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const hooks = [
    "You passed WAEC. Now what?",
    "Your parents want medicine. You want design.",
    "NYSC is over. 200 CVs sent. Nothing back.",
    "You got into poly. Is it the same as uni?",
    "You want to study abroad but don't know where to start.",
    "Everyone has a plan. You don't. That's okay."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setHookIndex((prev) => (prev + 1) % hooks.length);
        setVisible(true);
      }, 350);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) await window.aistudio.openSelectKey();
    }
    onStart();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[88vh] px-4 animate-fadeIn relative">

      {/* Subtle dot texture */}
      <div className="absolute inset-0 dot-pattern opacity-40 pointer-events-none" />

      {/* Hero */}
      <div className="text-center max-w-4xl mx-auto mb-16 relative z-10">

        {/* Rotating hook */}
        <div className="h-8 mb-10 flex items-center justify-center">
          <div
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-emerald-200 bg-white/70 backdrop-blur-sm shadow-sm"
            style={{ transition: 'opacity 0.3s ease', opacity: visible ? 1 : 0 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <p className="text-emerald-800 font-semibold text-sm md:text-base">
              {hooks[hookIndex]}
            </p>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-[clamp(2.6rem,8vw,6rem)] font-black text-slate-900 mb-6 tracking-tight leading-[0.92]">
          Someone should have
          <br />
          told you this{' '}
          <span className="brand-text-gradient">years ago.</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-xl mx-auto mb-12 font-medium">
          CareerSage is the career counselor most Nigerian students
          never had access to.
        </p>

        {/* CTA */}
        <div className="flex flex-col items-center gap-5">
          <button
            onClick={handleStart}
            className="group relative inline-flex items-center gap-3 px-10 py-4 rounded-full font-bold text-lg text-white shadow-xl shadow-emerald-900/25 hover:shadow-2xl hover:shadow-emerald-900/30 transition-all duration-300 hover:-translate-y-1 active:scale-95 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)' }}
          >
            {/* Shimmer overlay */}
            <span className="absolute inset-0 animate-shimmer pointer-events-none" />
            <span className="relative flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-emerald-300" />
              Tell me your situation
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>

          <div className="flex flex-col items-center gap-1.5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Built by someone who grew up in this system.
            </p>
            <p className="text-xs text-slate-400 max-w-xs text-center">
              A paid{' '}
              <a
                href="https://ai.google.dev/gemini-api/docs/billing"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-slate-300 underline-offset-2 hover:text-emerald-700 hover:decoration-emerald-400 transition-colors"
              >
                Google API key
              </a>{' '}
              is required for full analysis.
            </p>
          </div>
        </div>
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap justify-center gap-3 w-full max-w-3xl relative z-10">
        {[
          { icon: GraduationCap, label: 'JAMB & WAEC Guidance', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { icon: Briefcase,     label: 'NYSC & Job Market',    color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-100' },
          { icon: Building2,     label: 'Poly vs Uni Reality',  color: 'text-slate-700',   bg: 'bg-slate-50',   border: 'border-slate-200' },
        ].map(({ icon: Icon, label, color, bg, border }) => (
          <div
            key={label}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full ${bg} border ${border} shadow-sm`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${bg} border ${border}`}>
              <Icon className={`w-3.5 h-3.5 ${color}`} />
            </div>
            <span className={`text-sm font-semibold ${color}`}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WelcomeScreen;
