import { useState } from 'react';
import { MessageCircle } from 'lucide-react';

export const TestimonialSubmission = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [testimonial, setTestimonial] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleNameChange = (value: string) => {
    // Limit to alphanumeric, spaces, hyphens, apostrophes
    const cleaned = value.replace(/[^a-zA-Z\s'-]/g, '').slice(0, 100);
    setName(cleaned);
  };

  const handleRoleChange = (value: string) => {
    // Limit to alphanumeric, spaces, hyphens, slashes
    const cleaned = value.replace(/[^a-zA-Z0-9\s\-/()]/g, '').slice(0, 50);
    setRole(cleaned);
  };

  const handleTestimonialChange = (value: string) => {
    setTestimonial(value.slice(0, 500));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate on client side too
    if (!name.trim() || !role.trim() || !testimonial.trim()) {
      setMessageType('error');
      setMessage('All fields are required');
      return;
    }

    if (name.trim().length < 2) {
      setMessageType('error');
      setMessage('Name must be at least 2 characters');
      return;
    }

    if (testimonial.trim().length < 10) {
      setMessageType('error');
      setMessage('Testimonial must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/submit-testimonial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          role: role.trim(),
          testimonial: testimonial.trim(),
          date: new Date().toISOString().split('T')[0],
        }),
      });

      if (response.ok) {
        setMessageType('success');
        setMessage('Thank you! Your testimonial has been submitted.');
        setName('');
        setRole('');
        setTestimonial('');
        setTimeout(() => setIsOpen(false), 2000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessageType('error');
        
        if (response.status === 429) {
          setMessage('Too many requests. Please try again later.');
        } else if (response.status === 400) {
          setMessage(errorData.details?.[Object.keys(errorData.details)[0]] || 'Invalid input');
        } else {
          setMessage(errorData.error || 'Failed to submit. Please try again.');
        }
      }
    } catch (error) {
      setMessageType('error');
      setMessage('Network error. Please check your connection and try again.');
      console.error('[TestimonialSubmission] Error:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg p-6 w-96 max-w-[90vw]">
          <h3 className="text-lg font-semibold mb-2 text-gray-800">Share Your Experience</h3>
          <p className="text-xs text-gray-500 mb-4">Your testimonial will be published on our website and GitHub repository</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Your name"
              />
              <p className="text-xs text-gray-500 mt-1">{name.length}/100</p>
            </div>

            <div>
              <input
                type="text"
                placeholder="Your Role (e.g., Student, Job Seeker)"
                value={role}
                onChange={(e) => handleRoleChange(e.target.value)}
                required
                maxLength={50}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Your role"
              />
              <p className="text-xs text-gray-500 mt-1">{role.length}/50</p>
            </div>

            <div>
              <textarea
                placeholder="Share your testimonial (min 10, max 500 characters)"
                value={testimonial}
                onChange={(e) => handleTestimonialChange(e.target.value)}
                required
                maxLength={500}
                rows={4}
                minLength={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                aria-label="Your testimonial"
              />
              <p className="text-xs text-gray-500 mt-1">{testimonial.length}/500</p>
            </div>

            {message && (
              <div
                className={`text-sm p-3 rounded ${
                  messageType === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
                role="status"
              >
                {message}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting || !name.trim() || !role.trim() || !testimonial.trim() || testimonial.trim().length < 10}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-2 rounded-lg font-medium transition"
                aria-busy={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-medium transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition transform hover:scale-110"
        title="Share your testimonial"
        aria-label="Open testimonial form"
        aria-expanded={isOpen}
      >
        <MessageCircle size={24} />
      </button>
    </div>
  );
};
