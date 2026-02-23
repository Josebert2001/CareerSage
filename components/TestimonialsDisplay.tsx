import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  testimonial: string;
  date: string;
}

export const TestimonialsDisplay = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await fetch('/testimonials.json');
        const data = await response.json();
        setTestimonials(data.testimonials);
      } catch (error) {
        console.error('Error loading testimonials:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  if (loading) {
    return <div className="text-center text-gray-500">Loading testimonials...</div>;
  }

  if (testimonials.length === 0) {
    return <div className="text-center text-gray-500">No testimonials yet.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {testimonials.map((testimonial) => (
        <div
          key={testimonial.id}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
        >
          <div className="flex items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <p className="text-gray-700 mb-4 italic">"{testimonial.testimonial}"</p>
          <div className="border-t pt-3">
            <p className="font-semibold text-gray-900">{testimonial.name}</p>
            <p className="text-sm text-gray-600">{testimonial.role}</p>
            <p className="text-xs text-gray-500 mt-1">{new Date(testimonial.date).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
