/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  const [tip, setTip] = useState(0);
  const tips = [
    "Analyzing your unique profile...",
    "Reviewing market trends in your region...",
    "Identifying practical immediate steps...",
    "Crafting your long-term growth strategy...",
    "Considering educational requirements...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTip((prev) => (prev + 1) % tips.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [tips.length]);

  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
        <Loader2 className="w-16 h-16 text-emerald-600 animate-spin relative z-10" />
      </div>
      <h3 className="text-xl font-semibold text-slate-800 mb-2">Thinking...</h3>
      <p className="text-slate-500 text-center max-w-md h-6 animate-fadeSlideIn key={tip}">
        {tips[tip]}
      </p>
      
      <style>{`
        @keyframes fadeSlideIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeSlideIn {
          animation: fadeSlideIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;