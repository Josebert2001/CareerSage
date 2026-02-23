/**
 * Input validation functions
 * Validates testimonial submissions and other inputs
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

/**
 * Check for suspicious patterns
 * Detects potential spam, urls, emails, sql injection attempts
 */
const containsSuspiciousPatterns = (text: string): boolean => {
  if (typeof text !== 'string') return false;
  
  // Email pattern - not allowed in testimonials
  const emailPattern = /[^\s@]+@[^\s@]+\.[^\s@]+/;

  // URL pattern - not allowed for testimonials
  const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/i;

  // SQL injection attempts
  const sqlPattern = /(DROP|DELETE|INSERT|UPDATE|SELECT|EXEC|UNION|ALTER|CREATE)\s+/i;

  // Script tags or HTML
  const scriptPattern = /<script|javascript:|on\w+\s*=/i;

  // Excessive repetition (likely spam)
  const repetitionPattern = /(.)\1{9,}/;

  return (
    emailPattern.test(text) ||
    urlPattern.test(text) ||
    sqlPattern.test(text) ||
    scriptPattern.test(text) ||
    repetitionPattern.test(text)
  );
};

/**
 * Sanitize text content
 * Removes potentially sensitive patterns
 */
const sanitizeText = (text: string): string => {
  if (typeof text !== 'string') return '';
  
  // Remove email addresses
  text = text.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[email]");

  // Remove phone numbers (basic pattern)
  text = text.replace(/(\+\d{1,3}[-.\s]?)?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g, "[phone]");

  // Remove URLs (replace with [link])
  text = text.replace(/(https?:\/\/[^\s]+|www\.[^\s]+)/gi, "[link]");

  return text;
};

/**
 * Validate testimonial data
 * Checks type, length, and format
 */
export const validateTestimonial = (data: TestimonialInput): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Validate name
  if (!data.name || typeof data.name !== "string") {
    errors.push({ field: "name", message: "Name is required and must be text" });
  } else if (data.name.length < 2) {
    errors.push({ field: "name", message: "Name must be at least 2 characters" });
  } else if (data.name.length > 100) {
    errors.push({ field: "name", message: "Name must be less than 100 characters" });
  } else if (!/^[a-zA-Z\s'-]+$/.test(data.name)) {
    errors.push({
      field: "name",
      message: "Name can only contain letters, spaces, hyphens, and apostrophes",
    });
  }

  // Validate role
  if (!data.role || typeof data.role !== "string") {
    errors.push({ field: "role", message: "Role is required and must be text" });
  } else if (data.role.length < 2) {
    errors.push({ field: "role", message: "Role must be at least 2 characters" });
  } else if (data.role.length > 50) {
    errors.push({ field: "role", message: "Role must be less than 50 characters" });
  } else if (!/^[a-zA-Z0-9\s\-/()]+$/.test(data.role)) {
    errors.push({
      field: "role",
      message: "Role contains invalid characters",
    });
  }

  // Validate testimonial
  if (!data.testimonial || typeof data.testimonial !== "string") {
    errors.push({
      field: "testimonial",
      message: "Testimonial is required and must be text",
    });
  } else if (data.testimonial.length < 10) {
    errors.push({
      field: "testimonial",
      message: "Testimonial must be at least 10 characters",
    });
  } else if (data.testimonial.length > 500) {
    errors.push({
      field: "testimonial",
      message: "Testimonial must be less than 500 characters",
    });
  } else if (containsSuspiciousPatterns(data.testimonial)) {
    errors.push({
      field: "testimonial",
      message: "Testimonial contains suspicious content",
    });
  }

  // Validate date (optional)
  if (data.date && typeof data.date !== "string") {
    errors.push({ field: "date", message: "Date must be text if provided" });
  } else if (data.date) {
    // Check if valid ISO date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date as string)) {
      errors.push({
        field: "date",
        message: "Date must be in YYYY-MM-DD format",
      });
    } else {
      // Check if date is not in future
      const inputDate = new Date(data.date as string);
      if (inputDate > new Date()) {
        errors.push({ field: "date", message: "Date cannot be in the future" });
      }
    }
  }

  return errors;
};

/**
 * Sanitize testimonial data
 * Removes or replaces potentially sensitive information
 */
export const sanitizeTestimonial = (data: TestimonialInput): TestimonialInput => {
  return {
    name: typeof data.name === "string" ? data.name.trim() : "",
    role: typeof data.role === "string" ? data.role.trim() : "",
    testimonial: typeof data.testimonial === "string" ? sanitizeText(data.testimonial.trim()) : "",
    date: typeof data.date === "string" ? data.date : undefined,
  };
};

/**
 * Format validation errors for response
 */
export const formatValidationErrors = (errors: ValidationError[]): Record<string, string> => {
  const formatted: Record<string, string> = {};
  for (const error of errors) {
    formatted[error.field] = error.message;
  }
  return formatted;
};
