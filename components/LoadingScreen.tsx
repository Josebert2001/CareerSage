import React, { useEffect, useState } from 'react';

const tips = [
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
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTip((prev) => (prev + 1) % tips.length);
    }, 3000);
    return () => clearInterval(tipInterval);
  }, []);

  useEffect(() => {
    const target = Math.min(95, 8 + (tip + 1) * (87 / tips.length));
    const step = (target - progress) / 20;
    let current = progress;
    const frame = setInterval(() => {
      current += step;
      if (current >= target) { clearInterval(frame); setProgress(target); }
      else setProgress(current);
    }, 40);
    return () => clearInterval(frame);
  }, [tip]);

  return (
    <div
      className="flex flex-col items-center justify-center py-24 animate-fadeIn"
      role="status"
      aria-live="polite"
    >
      {/* Spinner */}
      <div className="relative mb-10">
        {/* Outer glow ring */}
        <div className="absolute inset-[-8px] rounded-full bg-emerald-500 opacity-10 animate-pulse" />

        {/* Rotating arc */}
        <svg
          className="w-20 h-20 animate-spin"
          viewBox="0 0 80 80"
          fill="none"
          aria-hidden="true"
          style={{ animationDuration: '1.2s' }}
        >
          <circle
            cx="40" cy="40" r="34"
            stroke="#d1fae5"
            strokeWidth="5"
          />
          <circle
            cx="40" cy="40" r="34"
            stroke="url(#spinGrad)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="80 140"
            strokeDashoffset="-10"
          />
          <defs>
            <linearGradient id="spinGrad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
        </svg>

        {/* Centre dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-emerald-600 animate-pulse" />
        </div>
      </div>

      <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
        Thinking through your situation…
      </h3>

      {/* Rotating tip */}
      <div className="h-6 overflow-hidden mb-10">
        <p
          key={tip}
          className="text-emerald-700 font-medium text-center text-sm animate-fadeSlideIn"
        >
          {tips[tip]}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-64 h-1 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #059669, #34d399)'
          }}
        />
      </div>
      <p className="text-xs text-slate-400 mt-2 font-medium">
        {Math.round(progress)}% complete
      </p>
    </div>
  );
};

export default LoadingScreen;
