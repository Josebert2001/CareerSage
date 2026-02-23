import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Build integrity tests
 * Ensures critical files and exports exist and are well-formed
 */

describe('Project Structure Integrity', () => {
  it('exports generateCareerAdvice from geminiService', async () => {
    const module = await import('../services/geminiService');
    expect(typeof module.generateCareerAdvice).toBe('function');
  });

  it('exports storage functions', async () => {
    const module = await import('../services/storage');
    expect(typeof module.getHistory).toBe('function');
    expect(typeof module.saveSession).toBe('function');
    expect(typeof module.deleteSession).toBe('function');
  });

  it('exports validation functions', async () => {
    const module = await import('../api/middleware/validation');
    expect(typeof module.validateTestimonial).toBe('function');
    expect(typeof module.sanitizeTestimonial).toBe('function');
    expect(typeof module.formatValidationErrors).toBe('function');
  });

  it('exports security functions', async () => {
    const module = await import('../api/middleware/security');
    expect(typeof module.validateOrigin).toBe('function');
    expect(typeof module.sanitizeError).toBe('function');
    expect(typeof module.checkRateLimit).toBe('function');
    expect(typeof module.cleanupRateLimitMap).toBe('function');
    expect(typeof module.addSecurityHeaders).toBe('function');
    expect(typeof module.safeLog).toBe('function');
  });

  it('exports App component', async () => {
    const module = await import('../App');
    expect(module.default).toBeDefined();
  });

  it('has valid testimonials.json structure', () => {
    const filePath = path.resolve(__dirname, '../testimonials.json');
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(content).toHaveProperty('testimonials');
    expect(Array.isArray(content.testimonials)).toBe(true);
    for (const t of content.testimonials) {
      expect(t).toHaveProperty('id');
      expect(t).toHaveProperty('name');
      expect(t).toHaveProperty('role');
      expect(t).toHaveProperty('testimonial');
      expect(t).toHaveProperty('date');
    }
  });
});
