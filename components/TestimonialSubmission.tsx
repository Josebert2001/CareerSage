import React, { useState, useCallback } from 'react';
import { Send, CheckCircle, AlertCircle, Shield, Loader2 } from 'lucide-react';

interface TestimonialSubmissionProps {
  onSubmitted?: () => void;
}

const MAX_NAME = 100;
const MAX_ROLE = 50;
const MAX_TEXT = 500;
const MIN_TEXT = 10;
const SAFE_NAME_RE = /^[a-zA-Z\s'-]+$/;
const SAFE_ROLE_RE = /^[a-zA-Z0-9\s/,'-]+$/;

const TestimonialSubmission: React.FC<TestimonialSubmissionProps> = ({ onSubmitted }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [testimonial, setTestimonial] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const clientValidate = useCallback((): string | null => {
    const n = name.trim();
    const r = role.trim();
    const t = testimonial.trim();
    if (!n) return 'Name is required.';
    if (n.length < 2 || n.length > MAX_NAME) return `Name must be 2–${MAX_NAME} characters.`;
    if (!SAFE_NAME_RE.test(n)) return 'Name contains invalid characters.';
    if (!r) return 'Role is required.';
    if (r.length > MAX_ROLE) return `Role must be ${MAX_ROLE} characters or less.`;
    if (!SAFE_ROLE_RE.test(r)) return 'Role contains invalid characters.';
    if (!t) return 'Testimonial is required.';
    if (t.length < MIN_TEXT) return `Testimonial must be at least ${MIN_TEXT} characters.`;
    if (t.length > MAX_TEXT) return `Testimonial must be ${MAX_TEXT} characters or less.`;
    return null;
  }, [name, role, testimonial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = clientValidate();
    if (err) { setErrorMsg(err); setStatus('error'); return; }

    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/submit-testimonial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          role: role.trim(),
          testimonial: testimonial.trim(),
          date: new Date().toISOString().split('T')[0],
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error ?? body?.errors?.[0]?.message ?? 'Submission failed'
        );
      }

      setStatus('success');
      setName('');
      setRole('');
      setTestimonial('');
      onSubmitted?.();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit. Please try again.');
    }
  };

  return (
    <section className="max-w-2xl mx-auto mt-16 md:mt-20 mb-12 md:mb-16 animate-fadeIn" aria-label="Submit your testimonial">
      <div className="glass-card rounded-3xl p-6 md:p-8 lg:p-10">
        {/* Header */}
        <div className="text-center mb-8 md:mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-card mb-5 border border-blue-100/50">
            <Send className="w-4 h-4 text-blue-500" aria-hidden="true" />
            <span className="text-xs md:text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent uppercase tracking-wide">
              Share Your Experience
            </span>
          </div>
          <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3" role="heading" aria-level={2}>
            How has CareerSage helped you?
          </h3>
          <p className="text-slate-600 text-sm md:text-base">
            Your feedback helps others discover their career path
          </p>
        </div>

        {/* Success */}
        {status === 'success' ? (
          <div className="text-center py-12 animate-fadeIn" role="status" aria-live="polite">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" aria-hidden="true" />
            </div>
            <h4 className="text-lg md:text-xl font-bold text-slate-900 mb-3">Thank you!</h4>
            <p className="text-slate-600 mb-8 text-sm md:text-base">Your testimonial has been submitted for review.</p>
            <button
              onClick={() => setStatus('idle')}
              className="px-6 md:px-8 py-3 text-sm md:text-base font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              Submit another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="testimonial-name" className="block text-sm md:text-base font-semibold text-slate-700 mb-2">
                Your Name
              </label>
              <input
                id="testimonial-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                maxLength={MAX_NAME}
                required
                aria-required="true"
                aria-describedby={status === 'error' && errorMsg ? 'form-error' : undefined}
                className="w-full px-4 md:px-5 py-3 rounded-xl border border-slate-200 bg-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus-visible:outline-none transition-all text-slate-900 placeholder-slate-400 text-sm md:text-base"
              />
            </div>

            {/* Role */}
            <div>
              <label htmlFor="testimonial-role" className="block text-sm md:text-base font-semibold text-slate-700 mb-2">
                Your Role / Background
              </label>
              <input
                id="testimonial-role"
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Computer Science Student"
                maxLength={MAX_ROLE}
                required
                aria-required="true"
                className="w-full px-4 md:px-5 py-3 rounded-xl border border-slate-200 bg-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus-visible:outline-none transition-all text-slate-900 placeholder-slate-400 text-sm md:text-base"
              />
            </div>

            {/* Testimonial */}
            <div>
              <label htmlFor="testimonial-text" className="block text-sm md:text-base font-semibold text-slate-700 mb-2">
                Your Testimonial
              </label>
              <textarea
                id="testimonial-text"
                value={testimonial}
                onChange={(e) => setTestimonial(e.target.value)}
                placeholder="Tell us how CareerSage helped with your career planning…"
                maxLength={MAX_TEXT}
                rows={4}
                required
                aria-required="true"
                className="w-full px-4 md:px-5 py-3 rounded-xl border border-slate-200 bg-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus-visible:outline-none transition-all text-slate-900 placeholder-slate-400 resize-none text-sm md:text-base"
              />
              <p className="text-xs md:text-sm text-slate-400 mt-2 text-right font-medium">
                {testimonial.length}/{MAX_TEXT} characters
              </p>
            </div>

            {/* Error */}
            {status === 'error' && errorMsg && (
              <div id="form-error" className="flex items-start gap-3 text-red-600 text-sm md:text-base bg-red-50 rounded-xl p-4 border border-red-100" role="alert">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Privacy */}
            <div className="flex items-start gap-3 text-xs md:text-sm text-slate-600 bg-slate-50 rounded-xl p-4 border border-slate-100">
              <Shield className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0 mt-0.5 text-slate-400" aria-hidden="true" />
              <span>
                Your name and role will be shown publicly. We never share personal data beyond what you provide here.
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full py-3 md:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 flex items-center justify-center gap-2 text-sm md:text-base min-h-[44px] md:min-h-[48px]"
              aria-busy={status === 'submitting'}
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" aria-hidden="true" />
                  Submitting…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
                  Submit Testimonial
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default TestimonialSubmission;
