import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateOrigin,
  sanitizeError,
  checkRateLimit,
  cleanupRateLimitMap,
} from '../../api/middleware/security';

describe('validateOrigin', () => {
  it('accepts allowed production origin', () => {
    expect(validateOrigin('https://careersage.vercel.app')).toBe(true);
  });

  it('accepts allowed custom domain', () => {
    expect(validateOrigin('https://www.careersage.com')).toBe(true);
  });

  it('rejects unknown origins', () => {
    expect(validateOrigin('https://evil-site.com')).toBe(false);
  });

  it('rejects undefined origin', () => {
    expect(validateOrigin(undefined)).toBe(false);
  });

  it('rejects empty string origin', () => {
    expect(validateOrigin('')).toBe(false);
  });

  it('accepts localhost in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    expect(validateOrigin('http://localhost:3000')).toBe(true);
    expect(validateOrigin('http://localhost:5173')).toBe(true);
    process.env.NODE_ENV = originalEnv;
  });

  it('rejects localhost in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    expect(validateOrigin('http://localhost:3000')).toBe(false);
    process.env.NODE_ENV = originalEnv;
  });

  it('accepts FRONTEND_URL env var', () => {
    const originalUrl = process.env.FRONTEND_URL;
    process.env.FRONTEND_URL = 'https://custom-frontend.com';
    expect(validateOrigin('https://custom-frontend.com')).toBe(true);
    process.env.FRONTEND_URL = originalUrl;
  });
});

describe('sanitizeError', () => {
  it('returns generic message in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const result = sanitizeError(new Error('Some detailed internal error'));
    expect(result).toBe('An error occurred. Please try again later.');
    process.env.NODE_ENV = originalEnv;
  });

  it('masks GitHub-related errors in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const result = sanitizeError(new Error('GITHUB_TOKEN is invalid'));
    expect(result).toBe('Failed to save testimonial. Please try again.');
    expect(result).not.toContain('GITHUB');
    process.env.NODE_ENV = originalEnv;
  });

  it('masks rate limit errors in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const result = sanitizeError(new Error('rate limit exceeded'));
    expect(result).toBe('Too many requests. Please wait before trying again.');
    process.env.NODE_ENV = originalEnv;
  });

  it('returns detailed message in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const result = sanitizeError(new Error('Detailed debug info'));
    expect(result).toBe('Detailed debug info');
    process.env.NODE_ENV = originalEnv;
  });

  it('handles non-Error types in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const result = sanitizeError('raw string error');
    expect(result).toBe('An error occurred. Please try again later.');
    process.env.NODE_ENV = originalEnv;
  });

  it('handles non-Error types in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const result = sanitizeError('raw string error');
    expect(result).toBe('raw string error');
    process.env.NODE_ENV = originalEnv;
  });
});

describe('checkRateLimit', () => {
  beforeEach(() => {
    cleanupRateLimitMap();
  });

  it('allows requests under the limit', () => {
    expect(checkRateLimit('test-user', 5, 60000)).toBe(true);
    expect(checkRateLimit('test-user', 5, 60000)).toBe(true);
    expect(checkRateLimit('test-user', 5, 60000)).toBe(true);
  });

  it('blocks requests over the limit', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('blocked-user', 3, 60000);
    }
    expect(checkRateLimit('blocked-user', 3, 60000)).toBe(false);
  });

  it('tracks different identifiers separately', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('user-a', 3, 60000);
    }
    // user-a is blocked
    expect(checkRateLimit('user-a', 3, 60000)).toBe(false);
    // user-b is still allowed
    expect(checkRateLimit('user-b', 3, 60000)).toBe(true);
  });

  it('allows requests after window expires', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    for (let i = 0; i < 3; i++) {
      checkRateLimit('expiring-user', 3, 1000);
    }
    expect(checkRateLimit('expiring-user', 3, 1000)).toBe(false);

    // Advance time past window
    vi.spyOn(Date, 'now').mockReturnValue(now + 1500);
    expect(checkRateLimit('expiring-user', 3, 1000)).toBe(true);

    vi.restoreAllMocks();
  });
});

describe('cleanupRateLimitMap', () => {
  it('runs without error on empty state', () => {
    expect(() => cleanupRateLimitMap()).not.toThrow();
  });
});
