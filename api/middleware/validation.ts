/**
 * Input validation & sanitisation for testimonial submissions.
 */

export interface TestimonialInput {
  name?: unknown;
  role?: unknown;
  testimonial?: unknown;
  date?: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
}

// ── Pattern detectors ──────────────────────────────────────────────────────

const SUSPICIOUS_PATTERNS = [
  /[^\s@]+@[^\s@]+\.[^\s@]+/,                              // email
  /(https?:\/\/[^\s]+|www\.[^\s]+)/i,                      // url
  /(DROP|DELETE|INSERT|UPDATE|SELECT|EXEC|UNION|ALTER|CREATE)\s+/i, // SQL
  /<script|javascript:|on\w+\s*=/i,                         // XSS
  /(.)\1{9,}/,                                              // spam repetition
];

const containsSuspiciousPatterns = (text: string): boolean =>
  SUSPICIOUS_PATTERNS.some((p) => p.test(text));

// ── Text sanitiser ─────────────────────────────────────────────────────────

export const sanitizeText = (text: string): string => {
  let s = text.trim();
  s = s.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[email]");     // emails
  s = s.replace(/(https?:\/\/[^\s]+|www\.[^\s]+)/gi, "[url]"); // urls
  s = s.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, "[phone]");
  s = s.replace(/<[^>]*>/g, "");                               // html tags
  return s;
};

// ── Name validation ────────────────────────────────────────────────────────

const SAFE_NAME_REGEX = /^[a-zA-Z\s'-]+$/;

export const validateName = (name: unknown): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    errors.push({ field: "name", message: "Name is required" });
    return errors;
  }
  const trimmed = name.trim();
  if (trimmed.length < 2)
    errors.push({ field: "name", message: "Name must be at least 2 characters" });
  if (trimmed.length > 100)
    errors.push({ field: "name", message: "Name must be 100 characters or less" });
  if (!SAFE_NAME_REGEX.test(trimmed))
    errors.push({ field: "name", message: "Name contains invalid characters" });
  return errors;
};

// ── Role validation ────────────────────────────────────────────────────────

const SAFE_ROLE_REGEX = /^[a-zA-Z0-9\s/,'-]+$/;

export const validateRole = (role: unknown): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (!role || typeof role !== "string" || role.trim().length === 0) {
    errors.push({ field: "role", message: "Role is required" });
    return errors;
  }
  const trimmed = role.trim();
  if (trimmed.length > 50)
    errors.push({ field: "role", message: "Role must be 50 characters or less" });
  if (!SAFE_ROLE_REGEX.test(trimmed))
    errors.push({ field: "role", message: "Role contains invalid characters" });
  return errors;
};

// ── Testimonial body validation ────────────────────────────────────────────

export const validateTestimonialText = (text: unknown): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    errors.push({ field: "testimonial", message: "Testimonial text is required" });
    return errors;
  }
  const trimmed = text.trim();
  if (trimmed.length < 10)
    errors.push({ field: "testimonial", message: "Testimonial must be at least 10 characters" });
  if (trimmed.length > 500)
    errors.push({ field: "testimonial", message: "Testimonial must be 500 characters or less" });
  if (containsSuspiciousPatterns(trimmed))
    errors.push({ field: "testimonial", message: "Testimonial contains disallowed content" });
  return errors;
};

// ── Date validation ────────────────────────────────────────────────────────

export const validateDate = (date: unknown): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (!date || typeof date !== "string") {
    errors.push({ field: "date", message: "Date is required" });
    return errors;
  }
  const parsed = new Date(date);
  if (isNaN(parsed.getTime()))
    errors.push({ field: "date", message: "Invalid date format" });
  else if (parsed > new Date())
    errors.push({ field: "date", message: "Date cannot be in the future" });
  return errors;
};

// ── Aggregate validator ────────────────────────────────────────────────────

export const validateTestimonial = (
  data: TestimonialInput
): ValidationError[] => [
  ...validateName(data.name),
  ...validateRole(data.role),
  ...validateTestimonialText(data.testimonial),
  ...validateDate(data.date),
];
