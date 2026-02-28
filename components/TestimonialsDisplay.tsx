import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote, Users } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  testimonial: string;
  date: string;
}

// Seed data is loaded from /testimonials.json at runtime
const TestimonialsDisplay: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch('/testimonials.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Testimonial[]) => {
        if (Array.isArray(data) && data.length > 0) setTestimonials(data);
      })
      .catch(() => {/* silently fail — testimonials are non-critical */});
  }, []);

  // ── Auto-rotate ──────────────────────────────────────────────────────────
  const startAutoRotate = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (testimonials.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
  }, [testimonials.length]);

  useEffect(() => {
    startAutoRotate();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [startAutoRotate]);

  const goTo = useCallback(
    (dir: -1 | 1) => {
      setActiveIndex((prev) => (prev + dir + testimonials.length) % testimonials.length);
      startAutoRotate(); // reset timer on manual nav
    },
    [testimonials.length, startAutoRotate],
  );

  if (testimonials.length === 0) return null;

  const current = testimonials[activeIndex];

  return (
    <div className="max-w-4xl mx-auto mt-16 mb-8 animate-fadeIn">
      {/* Section header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-4">
          <Users className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Community Stories
          </span>
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">What Others Are Saying</h3>
        <p className="text-slate-500 text-sm">
          Real experiences from people who used CareerSage
        </p>
      </div>

      {/* Card */}
      <div className="relative glass-card rounded-3xl p-8 md:p-10">
        <Quote className="absolute top-6 left-6 w-10 h-10 text-blue-100" />

        <div className="relative z-10 text-center">
          {/* Stars */}
          <div className="flex justify-center gap-1 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
            ))}
          </div>

          {/* Body */}
          <blockquote className="text-lg md:text-xl text-slate-700 italic leading-relaxed mb-6 max-w-2xl mx-auto">
            &ldquo;{current.testimonial}&rdquo;
          </blockquote>

          {/* Attribution */}
          <div className="font-semibold text-slate-900">{current.name}</div>
          <div className="text-sm text-slate-500">{current.role}</div>
        </div>

        {/* Nav arrows */}
        {testimonials.length > 1 && (
          <>
            <button
              onClick={() => goTo(-1)}
              aria-label="Previous testimonial"
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <button
              onClick={() => goTo(1)}
              aria-label="Next testimonial"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow transition-all"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      {testimonials.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => { setActiveIndex(i); startAutoRotate(); }}
              aria-label={`Go to testimonial ${i + 1}`}
              className={`w-2 h-2 rounded-full transition-all ${
                i === activeIndex
                  ? 'bg-blue-500 w-6'
                  : 'bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TestimonialsDisplay;
