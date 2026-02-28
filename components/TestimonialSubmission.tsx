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
    <div className="max-w-2xl mx-auto mt-16 mb-8 animate-fadeIn">
      <div className="glass-card rounded-3xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-4">
            <Send className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Share Your Experience
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            How has CareerSage helped you?
          </h3>
          <p className="text-slate-500 text-sm">
            Your feedback helps others discover their career path
          </p>
        </div>

        {/* Success */}
        {status === 'success' ? (
          <div className="text-center py-8 animate-fadeIn">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">Thank you!</h4>
            <p className="text-slate-600 mb-6">Your testimonial has been submitted for review.</p>
            <button
              onClick={() => setStatus('idle')}
              className="px-6 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Submit another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                maxLength={MAX_NAME}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-900 placeholder-slate-400"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Your Role / Background
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Computer Science Student"
                maxLength={MAX_ROLE}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-900 placeholder-slate-400"
              />
            </div>

            {/* Testimonial */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Your Testimonial
              </label>
              <textarea
                value={testimonial}
                onChange={(e) => setTestimonial(e.target.value)}
                placeholder="Tell us how CareerSage helped with your career planning…"
                maxLength={MAX_TEXT}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-900 placeholder-slate-400 resize-none"
              />
              <p className="text-xs text-slate-400 mt-1 text-right">
                {testimonial.length}/{MAX_TEXT}
              </p>
            </div>

            {/* Error */}
            {status === 'error' && errorMsg && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Privacy */}
            <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 rounded-xl p-3">
              <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-400" />
              <span>
                Your name and role will be shown publicly. We never share personal data
                beyond what you provide here.
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
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
