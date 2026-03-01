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
    <section className="max-w-4xl mx-auto mt-16 md:mt-20 mb-12 md:mb-16 animate-fadeIn" aria-label="Customer testimonials">
      {/* Section header */}
      <div className="text-center mb-10 md:mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-card mb-5 border border-blue-100/50">
          <Users className="w-4 h-4 text-blue-500" aria-hidden="true" />
          <span className="text-xs md:text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent uppercase tracking-wide">
            Community Stories
          </span>
        </div>
        <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3" role="heading" aria-level={2}>What Others Are Saying</h3>
        <p className="text-slate-600 text-sm md:text-base">
          Real experiences from people who used CareerSage
        </p>
      </div>

      {/* Card */}
      <div className="relative glass-card rounded-3xl p-8 md:p-12 hover:shadow-lg transition-all">
        <Quote className="absolute top-6 md:top-8 left-6 md:left-8 w-10 md:w-12 h-10 md:h-12 text-blue-100 opacity-60" aria-hidden="true" />

        <div className="relative z-10 text-center space-y-6 md:space-y-8">
          {/* Stars */}
          <div className="flex justify-center gap-1.5" aria-label="5 out of 5 stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-5 h-5 md:w-6 md:h-6 text-amber-400 fill-amber-400" aria-hidden="true" />
            ))}
          </div>

          {/* Body */}
          <blockquote className="text-lg md:text-xl lg:text-2xl text-slate-700 leading-relaxed max-w-2xl mx-auto">
            &ldquo;{current.testimonial}&rdquo;
          </blockquote>

          {/* Attribution */}
          <div className="flex flex-col items-center gap-1">
            <div className="font-bold text-slate-900 text-base md:text-lg">{current.name}</div>
            <div className="text-sm md:text-base text-slate-500">{current.role}</div>
          </div>
        </div>

        {/* Nav arrows */}
        {testimonials.length > 1 && (
          <>
            <button
              onClick={() => goTo(-1)}
              aria-label={`Previous testimonial, ${activeIndex === 0 ? 'Testimonial ' + testimonials.length : 'Testimonial ' + activeIndex}`}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 md:p-3 rounded-full bg-white/80 hover:bg-white shadow-md hover:shadow-lg transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-slate-600" aria-hidden="true" />
            </button>
            <button
              onClick={() => goTo(1)}
              aria-label={`Next testimonial, Testimonial ${activeIndex === testimonials.length - 1 ? 1 : activeIndex + 2}`}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 md:p-3 rounded-full bg-white/80 hover:bg-white shadow-md hover:shadow-lg transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-slate-600" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {/* Dots - Indicator */}
      {testimonials.length > 1 && (
        <div className="flex justify-center gap-2 mt-6 md:mt-8" role="tablist" aria-label="Testimonial selector">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => { setActiveIndex(i); startAutoRotate(); }}
              role="tab"
              aria-selected={i === activeIndex}
              aria-label={`Go to testimonial ${i + 1} of ${testimonials.length}`}
              className={`transition-all rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                i === activeIndex
                  ? 'bg-blue-500 w-8 h-2.5'
                  : 'bg-slate-300 hover:bg-slate-400 w-2 h-2.5'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default TestimonialsDisplay;
