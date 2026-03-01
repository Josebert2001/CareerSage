import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const TIPS = [
  "Checking what's actually hiring in Lagos right now...",
  "Looking at what people with your background are doing...",
  "Finding the path that fits your actual life, not a perfect one...",
  "Reviewing what JAMB and WAEC results open up for you...",
  "Checking scholarship windows that are still open...",
  "Thinking through your family situation and what's realistic...",
  "Almost ready — putting your two pathways together..."
];

const LoadingScreen: React.FC = () => {
  const [tip, setTip] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTip((prev) => (prev + 1) % TIPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24 animate-fadeIn" role="status" aria-live="polite" aria-label="Processing your information">
      {/* Enhanced spinner with better visual feedback */}
      <div className="relative mb-8 md:mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 blur-3xl opacity-15 rounded-full animate-pulse"></div>
        <div className="relative z-10 flex items-center justify-center w-24 h-24 md:w-28 md:h-28">
          <Loader2 className="w-full h-full text-emerald-700 animate-spin stroke-[1.2px]" aria-hidden="true" />
        </div>
      </div>

      {/* Main message */}
      <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6 text-center" aria-label="Processing status">
        Thinking through your situation...
      </h3>

      {/* Dynamic tip message with smooth transitions */}
      <div className="h-10 md:h-12 overflow-hidden max-w-md">
        <p className="text-emerald-700 font-medium text-center text-base md:text-lg animate-fadeSlideIn leading-relaxed" key={tip}>
          {TIPS[tip]}
        </p>
      </div>

      {/* Progress indicator dots */}
      <div className="flex gap-2 mt-8 md:mt-12">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-emerald-400 transition-opacity duration-300"
            style={{ opacity: 0.3 + (0.7 * (Math.floor(tip / 2) % 3 === i ? 1 : 0)) }}
            aria-hidden="true"
          />
        ))}
      </div>
      
      <style>{`
        @keyframes fadeSlideIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeSlideIn {
          animation: fadeSlideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
