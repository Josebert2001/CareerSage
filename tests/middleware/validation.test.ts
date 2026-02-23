import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateTestimonial,
  sanitizeTestimonial,
  formatValidationErrors,
} from '../../api/middleware/validation';

describe('validateTestimonial', () => {
  // --- Name validation ---
  describe('name field', () => {
    it('rejects missing name', () => {
      const errors = validateTestimonial({ role: 'Student', testimonial: 'Great app for students!' });
      expect(errors.some(e => e.field === 'name')).toBe(true);
    });

    it('rejects non-string name', () => {
      const errors = validateTestimonial({ name: 123, role: 'Student', testimonial: 'Great app for students!' });
      expect(errors.some(e => e.field === 'name')).toBe(true);
    });

    it('rejects name shorter than 2 chars', () => {
      const errors = validateTestimonial({ name: 'A', role: 'Student', testimonial: 'Great app for students!' });
      expect(errors.some(e => e.field === 'name' && e.message.includes('2 characters'))).toBe(true);
    });

    it('rejects name longer than 100 chars', () => {
      const errors = validateTestimonial({ name: 'A'.repeat(101), role: 'Student', testimonial: 'Great app for students!' });
      expect(errors.some(e => e.field === 'name' && e.message.includes('100'))).toBe(true);
    });

    it('rejects name with special characters', () => {
      const errors = validateTestimonial({ name: 'User<script>', role: 'Student', testimonial: 'Great app for students!' });
      expect(errors.some(e => e.field === 'name')).toBe(true);
    });

    it('accepts valid name with hyphens and apostrophes', () => {
      const errors = validateTestimonial({ name: "Jean-Pierre O'Brien", role: 'Student', testimonial: 'Great app for students!' });
      expect(errors.some(e => e.field === 'name')).toBe(false);
    });
  });

  // --- Role validation ---
  describe('role field', () => {
    it('rejects missing role', () => {
      const errors = validateTestimonial({ name: 'John', testimonial: 'Great app for students!' });
      expect(errors.some(e => e.field === 'role')).toBe(true);
    });

    it('rejects role longer than 50 chars', () => {
      const errors = validateTestimonial({ name: 'John', role: 'A'.repeat(51), testimonial: 'Great app for students!' });
      expect(errors.some(e => e.field === 'role')).toBe(true);
    });

    it('accepts valid role with slashes and parens', () => {
      const errors = validateTestimonial({ name: 'John', role: 'Student (Year 3/4)', testimonial: 'Great app for students!' });
      expect(errors.some(e => e.field === 'role')).toBe(false);
    });
  });

  // --- Testimonial validation ---
  describe('testimonial field', () => {
    it('rejects missing testimonial', () => {
      const errors = validateTestimonial({ name: 'John', role: 'Student' });
      expect(errors.some(e => e.field === 'testimonial')).toBe(true);
    });

    it('rejects testimonial shorter than 10 chars', () => {
      const errors = validateTestimonial({ name: 'John', role: 'Student', testimonial: 'Good' });
      expect(errors.some(e => e.field === 'testimonial' && e.message.includes('10'))).toBe(true);
    });

    it('rejects testimonial longer than 500 chars', () => {
      const errors = validateTestimonial({ name: 'John', role: 'Student', testimonial: 'A'.repeat(501) });
      expect(errors.some(e => e.field === 'testimonial' && e.message.includes('500'))).toBe(true);
    });

    it('rejects testimonial with URLs', () => {
      const errors = validateTestimonial({ name: 'John', role: 'Student', testimonial: 'Check out https://spam.com for more' });
      expect(errors.some(e => e.field === 'testimonial' && e.message.includes('suspicious'))).toBe(true);
    });

    it('rejects testimonial with email addresses', () => {
      const errors = validateTestimonial({ name: 'John', role: 'Student', testimonial: 'Contact me at user@example.com please' });
      expect(errors.some(e => e.field === 'testimonial' && e.message.includes('suspicious'))).toBe(true);
    });

    it('rejects testimonial with SQL injection', () => {
      const errors = validateTestimonial({ name: 'John', role: 'Student', testimonial: 'Great app; DROP TABLE users;' });
      expect(errors.some(e => e.field === 'testimonial' && e.message.includes('suspicious'))).toBe(true);
    });

    it('rejects testimonial with script tags', () => {
      const errors = validateTestimonial({ name: 'John', role: 'Student', testimonial: 'Nice app <script>alert(1)</script>' });
      expect(errors.some(e => e.field === 'testimonial' && e.message.includes('suspicious'))).toBe(true);
    });

    it('rejects testimonial with excessive repetition', () => {
      const errors = validateTestimonial({ name: 'John', role: 'Student', testimonial: 'aaaaaaaaaa is great app' });
      expect(errors.some(e => e.field === 'testimonial' && e.message.includes('suspicious'))).toBe(true);
    });
  });

  // --- Date validation ---
  describe('date field', () => {
    it('accepts missing date (optional)', () => {
      const errors = validateTestimonial({ name: 'John', role: 'Student', testimonial: 'Great app for students!' });
      expect(errors.some(e => e.field === 'date')).toBe(false);
    });

    it('rejects invalid date format', () => {
      const errors = validateTestimonial({ name: 'John', role: 'Student', testimonial: 'Great app for students!', date: '22-02-2026' });
      expect(errors.some(e => e.field === 'date' && e.message.includes('YYYY-MM-DD'))).toBe(true);
    });

    it('rejects future date', () => {
      const errors = validateTestimonial({ name: 'John', role: 'Student', testimonial: 'Great app for students!', date: '2099-01-01' });
      expect(errors.some(e => e.field === 'date' && e.message.includes('future'))).toBe(true);
    });

    it('accepts valid past date', () => {
      const errors = validateTestimonial({ name: 'John', role: 'Student', testimonial: 'Great app for students!', date: '2024-06-15' });
      expect(errors.some(e => e.field === 'date')).toBe(false);
    });
  });

  // --- Full valid submission ---
  describe('valid submissions', () => {
    it('returns no errors for valid input', () => {
      const errors = validateTestimonial({
        name: 'Jane Doe',
        role: 'University Student',
        testimonial: 'CareerSage helped me discover paths I never considered. Highly recommend!',
        date: '2025-12-01',
      });
      expect(errors).toHaveLength(0);
    });

    it('returns no errors without optional date', () => {
      const errors = validateTestimonial({
        name: 'Jane Doe',
        role: 'Graduate',
        testimonial: 'Amazing tool that gave me clarity on my career options.',
      });
      expect(errors).toHaveLength(0);
    });
  });
});

describe('sanitizeTestimonial', () => {
  it('trims whitespace from all fields', () => {
    const result = sanitizeTestimonial({
      name: '  Jane Doe  ',
      role: '  Student  ',
      testimonial: '  Great app!  ',
      date: '2025-01-01',
    });
    expect(result.name).toBe('Jane Doe');
    expect(result.role).toBe('Student');
    expect(result.testimonial).toBe('Great app!');
  });

  it('replaces emails in testimonial text', () => {
    const result = sanitizeTestimonial({
      name: 'John',
      role: 'Student',
      testimonial: 'Reach me at john@gmail.com for more',
    });
    expect(result.testimonial).toContain('[email]');
    expect(result.testimonial).not.toContain('john@gmail.com');
  });

  it('replaces URLs in testimonial text', () => {
    const result = sanitizeTestimonial({
      name: 'John',
      role: 'Student',
      testimonial: 'Visit https://example.com for details',
    });
    expect(result.testimonial).toContain('[link]');
    expect(result.testimonial).not.toContain('https://example.com');
  });

  it('handles non-string inputs gracefully', () => {
    const result = sanitizeTestimonial({
      name: 123 as any,
      role: null as any,
      testimonial: undefined as any,
    });
    expect(result.name).toBe('');
    expect(result.role).toBe('');
    expect(result.testimonial).toBe('');
  });
});

describe('formatValidationErrors', () => {
  it('formats errors into a record', () => {
    const errors = [
      { field: 'name', message: 'Name is required' },
      { field: 'role', message: 'Role is required' },
    ];
    const formatted = formatValidationErrors(errors);
    expect(formatted).toEqual({
      name: 'Name is required',
      role: 'Role is required',
    });
  });

  it('returns empty object for no errors', () => {
    expect(formatValidationErrors([])).toEqual({});
  });
});
