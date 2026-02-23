import { VercelResponse } from "@vercel/node";

/**
 * Security headers middleware
 * Adds important security headers to all API responses
 */
export const addSecurityHeaders = (res: VercelResponse) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
};

/**
 * CORS validation
 * Only allow requests from whitelisted origins
 */
export const validateOrigin = (origin: string | undefined): boolean => {
  const allowedOrigins = [
    "https://careersage.vercel.app",
    "https://www.careersage.com",
    process.env.FRONTEND_URL || "",
    // Allow localhost for development
    ...(process.env.NODE_ENV === "development"
      ? ["http://localhost:3000", "http://localhost:5173"]
      : []),
  ].filter(Boolean);

  return origin ? allowedOrigins.includes(origin) : false;
};

/**
 * Sanitize error messages
 * Returns generic messages in production, detailed in development
 */
export const sanitizeError = (error: unknown): string => {
  const isDevelopment = process.env.NODE_ENV === "development";

  if (error instanceof Error) {
    if (isDevelopment) {
      return error.message;
    }
    // Don't expose specific errors in production
    if (error.message.includes("GITHUB")) {
      return "Failed to save testimonial. Please try again.";
    }
    if (error.message.includes("rate")) {
      return "Too many requests. Please wait before trying again.";
    }
    return "An error occurred. Please try again later.";
  }

  return isDevelopment ? String(error) : "An error occurred. Please try again later.";
};

/**
 * Safe logging
 * Never logs sensitive data like tokens or personal information
 */
export const safeLog = (context: string, error: unknown, sanitize = true) => {
  if (process.env.NODE_ENV === "development") {
    if (error instanceof Error) {
      console.error(`[${context}] ${error.message}`);
    } else {
      console.error(`[${context}]`, error);
    }
  } else {
    // In production, only log essential info
    if (sanitize) {
      console.error(`[${context}] An error occurred`);
    } else {
      console.error(`[${context}] ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

/**
 * Rate limiting check
 * Simple in-memory rate limiter for basic protection
 * For production, use Redis or similar
 */
const requestLog = new Map<string, number[]>();

export const checkRateLimit = (
  identifier: string,
  maxRequests = 10,
  windowMs = 60000
): boolean => {
  const now = Date.now();
  const requests = requestLog.get(identifier) || [];

  // Remove old requests outside the window
  const recentRequests = requests.filter((time) => now - time < windowMs);

  if (recentRequests.length >= maxRequests) {
    return false; // Rate limit exceeded
  }

  recentRequests.push(now);
  requestLog.set(identifier, recentRequests);

  return true; // Request allowed
};

/**
 * Clean old rate limit entries (run periodically)
 */
export const cleanupRateLimitMap = () => {
  const now = Date.now();
  const oneHourAgo = now - 3600000;

  for (const [key, times] of requestLog.entries()) {
    const recentTimes = times.filter((time) => time > oneHourAgo);
    if (recentTimes.length === 0) {
      requestLog.delete(key);
    } else {
      requestLog.set(key, recentTimes);
    }
  }
};
