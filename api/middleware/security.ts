import type { VercelResponse } from "@vercel/node";

/**
 * Adds security headers to all API responses.
 */
export const addSecurityHeaders = (res: VercelResponse) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
};

/**
 * CORS validation — only allow requests from whitelisted origins.
 */
export const validateOrigin = (origin: string | undefined): boolean => {
  const allowedOrigins = [
    "https://careersage.vercel.app",
    "https://www.careersage.com",
    process.env.FRONTEND_URL || "",
    ...(process.env.NODE_ENV === "development"
      ? ["http://localhost:3000", "http://localhost:5173"]
      : []),
  ].filter(Boolean);

  return origin ? allowedOrigins.includes(origin) : false;
};

/**
 * Return sanitised error strings — never leak internals in production.
 */
export const sanitizeError = (error: unknown): string => {
  const isDev = process.env.NODE_ENV === "development";

  if (error instanceof Error) {
    if (isDev) return error.message;
    if (error.message.includes("GITHUB"))
      return "Failed to save testimonial. Please try again.";
    if (error.message.includes("rate"))
      return "Too many requests. Please wait before trying again.";
    return "An error occurred. Please try again later.";
  }

  return isDev ? String(error) : "An error occurred. Please try again later.";
};

/**
 * Safe logging — never log tokens or PII.
 */
export const safeLog = (context: string, error: unknown) => {
  if (process.env.NODE_ENV === "development") {
    console.error(
      `[${context}]`,
      error instanceof Error ? error.message : error
    );
  } else {
    console.error(`[${context}] An error occurred`);
  }
};

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter (per serverless cold-start window)
// For production at scale, move to Redis / Upstash.
// ---------------------------------------------------------------------------
const requestLog = new Map<string, number[]>();

export const checkRateLimit = (
  identifier: string,
  maxRequests = 10,
  windowMs = 60_000
): boolean => {
  const now = Date.now();
  const requests = (requestLog.get(identifier) || []).filter(
    (t) => now - t < windowMs
  );

  if (requests.length >= maxRequests) return false;

  requests.push(now);
  requestLog.set(identifier, requests);
  return true;
};

/** Periodic cleanup — call in a cron if needed. */
export const cleanupRateLimitMap = () => {
  const cutoff = Date.now() - 3_600_000;
  for (const [key, times] of requestLog.entries()) {
    const recent = times.filter((t) => t > cutoff);
    if (recent.length === 0) requestLog.delete(key);
    else requestLog.set(key, recent);
  }
};
