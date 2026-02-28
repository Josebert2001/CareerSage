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
    <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
      <div className="relative mb-10">
        <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
        <Loader2 className="w-20 h-20 text-emerald-800 animate-spin relative z-10 stroke-[1.5px]" />
      </div>
      <h3 className="text-2xl font-black text-slate-900 mb-4">Thinking through your situation...</h3>
      <div className="h-8 overflow-hidden">
        <p className="text-emerald-800 font-medium text-center max-w-md animate-fadeSlideIn" key={tip}>
          {TIPS[tip]}
        </p>
      </div>
      
      <style>{`
        @keyframes fadeSlideIn {
          0% { opacity: 0; transform: translateY(15px); }
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