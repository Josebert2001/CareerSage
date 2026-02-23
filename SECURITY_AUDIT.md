# Security Audit Report - CareerSage

**Audit Date:** February 22, 2026  
**Severity Levels:** Critical | High | Medium | Low | Info

---

## Executive Summary

CareerSage has moderate security concerns across dependency vulnerabilities, API validation, and error handling. While no critical vulnerabilities threaten live data, several high-priority items require immediate attention before production deployment.

---

## 1. Dependency Vulnerabilities

### Status: 🔴 HIGH PRIORITY

**Vulnerabilities Found:** 16 (4 Moderate, 12 High)

| Package | Type | Severity | Issue |
|---------|------|----------|-------|
| `ajv` | ReDoS | Moderate | Regex DoS via `$data` option |
| `esbuild` | CORS | Moderate | Unsafe development server access |
| `minimatch` | ReDoS | High | Regex DoS via wildcards |
| `path-to-regexp` | ReDoS | High | Backtracking regex patterns |
| `tar` | TOCTOU/Symlink | High | File extraction vulnerabilities |
| `undici` | Multiple | Moderate | Random values, decompression, DoS |

**Impact:** These are primarily dev dependencies, but production builds could be compromised.

**Recommendation:**
```bash
npm audit fix --force
```

⚠️ **Note:** Breaking changes expected. Test thoroughly after update.

---

## 2. API Security Issues

### 2.1 Missing Input Validation (Server-Side)

**Severity:** 🟡 MEDIUM

**Location:** `api/submit-testimonial.ts`

**Issue:** 
- Client-side `maxLength=500` can be bypassed
- No length validation on server
- No pattern validation for name/role fields
- No sanitization of testimonial text

**Fix Required:**
```typescript
// Add validation middleware/function
const validateTestimonial = (data: any) => {
  const errors: string[] = [];
  
  if (!data.name || typeof data.name !== 'string' || data.name.length > 100) {
    errors.push('Invalid name (1-100 chars)');
  }
  if (!data.role || typeof data.role !== 'string' || data.role.length > 50) {
    errors.push('Invalid role (1-50 chars)');
  }
  if (!data.testimonial || typeof data.testimonial !== 'string' || data.testimonial.length > 500) {
    errors.push('Invalid testimonial (1-500 chars)');
  }
  
  return errors;
};
```

### 2.2 Error Information Leakage

**Severity:** 🟡 MEDIUM

**Location:** `api/submit-testimonial.ts:74-76`, Multiple services

**Issue:**
```typescript
return res.status(500).json({
  error: error instanceof Error ? error.message : "Failed to submit testimonial"
});
```

Full error messages expose:
- GitHub API structure
- File paths
- Rate limiting details
- OAuth token hints

**Fix:** 
```typescript
// Sanitize error responses
const sanitizeError = (error: unknown): string => {
  if (process.env.NODE_ENV === 'development') {
    return error instanceof Error ? error.message : 'Unknown error';
  }
  // Production: generic message
  return 'An error occurred. Please try again later.';
};
```

### 2.3 Missing Response Security Headers

**Severity:** 🟡 MEDIUM

**Location:** All API endpoints (missing)

**Required Headers:**
```typescript
// Add to all responses
res.setHeader('X-Content-Type-Options', 'nosniff');
res.setHeader('X-Frame-Options', 'DENY');
res.setHeader('X-XSS-Protection', '1; mode=block');
res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
```

### 2.4 Missing CORS Security

**Severity:** 🟡 MEDIUM

**Issue:** No CORS validation on API endpoints

**Recommendation:**
```typescript
// Whitelist origin
const ALLOWED_ORIGINS = [
  'https://careersage.vercel.app',
  'https://www.careersage.com'
];

const isOriginAllowed = (origin: string | undefined) => {
  return origin && ALLOWED_ORIGINS.includes(origin);
};
```

### 2.5 Missing Rate Limiting

**Severity:** 🟡 MEDIUM

**Issue:** API endpoints have no rate limiting

**Risk:** 
- Spam testimonials
- GitHub API quota exhaustion
- DoS attacks

**Recommendation:**
```bash
npm install ratelimit vercel-rate-limit
```

---

## 3. File Upload Security

### Severity: 🟡 MEDIUM

**Location:** `components/InputForm.tsx:91-113`

**Issues:**

1. **No File Size Validation**
   - Could upload 100MB+ files
   - No cap on total request size

2. **No File Type Whitelist Enforcement**
   - Client-side type checking only
   - MIME type can be spoofed

3. **No File Count Limit**
   - User could attach unlimited files

**Fixes Required:**

```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'text/plain'
];
const MAX_FILES = 5;

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files) {
    const fileList = Array.from(e.target.files) as File[];
    
    // Validation
    if (fileList.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed`);
      return;
    }
    
    for (const file of fileList) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`File size must be under 5MB (${file.name})`);
        return;
      }
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setError(`File type not allowed: ${file.type}`);
        return;
      }
    }
    
    // Process files...
  }
};
```

---

## 4. Logging & Debug Information

### Severity: 🟡 MEDIUM

**Locations:**
- `components/TestimonialSubmission.tsx:43` - Raw error logging
- `api/submit-testimonial.ts:74` - Full error object logging
- Multiple components - Console errors

**Issue:**
```typescript
console.error('Error:', error); // Could log tokens, API keys
```

**Fix:**
```typescript
const safeLog = (context: string, error: unknown) => {
  // Never log sensitive data
  if (error instanceof Error) {
    console.error(`[${context}] ${error.message}`);
  } else {
    console.error(`[${context}] An error occurred`);
  }
};
```

Remove all production console.error calls or use library like:
```bash
npm install @sentry/react
```

---

## 5. API Key Management

### Severity: 🟢 LOW (Well-Configured)

**Status:** ✅ GOOD

**Verification:**
- ✅ API keys in environment variables only
- ✅ `.env` in `.gitignore`
- ✅ No hardcoded secrets found
- ✅ Proper Vercel secret configuration

**Recommendations:**
- Rotate `GITHUB_TOKEN` every 90 days
- Use environment-specific tokens if possible
- Monitor GitHub token usage on account settings

---

## 6. Input Sanitization

### Severity: 🟢 LOW (React Auto-Escapes)

**Status:** ✅ MOSTLY GOOD

**Finding:** React's JSX automatically escapes content, preventing XSS

**Recommendations:**
- Continue using JSX for rendering
- Avoid `innerHTML` and `dangerouslySetInnerHTML`
- Server-side HTML sanitization for emails (if implemented later)

---

## 7. Gemini API Security

### Severity: 🟢 LOW

**Status:** ✅ GOOD

**Verified:**
- ✅ API key properly handled
- ✅ No token leakage in errors
- ✅ Files validated before sending

**Recommendations:**
- Add API call timeout (30s default)
- Monitor for unusual API usage patterns

---

## 8. GitHub Integration Security

### Severity: 🟡 MEDIUM

**Current Implementation:** Direct repo access via GITHUB_TOKEN

**Issues:**
- Token can be extracted via errors
- Single point of failure
- No commit verification

**Recommendations:**

```typescript
// Create a separate GitHub account with limited permissions:
// 1. Create bot account (e.g., CareerSageBot)
// 2. Give ONLY "Files" read/write on this repo
// 3. Use bot token instead of personal token
// 4. Enable branch protection rules
```

**Verify Token Permissions:**
```bash
curl -H "Authorization: token YOUR_GITHUB_TOKEN" \
  https://api.github.com/user/permissions
```

Should show minimal scopes.

---

## 9. Authentication & Authorization

### Severity: 🟡 MEDIUM

**Issue:** No authentication required to submit testimonials

**Risk Level:** LOW (testimonials are public)

**Recommendations:**
- Add honeypot fields to detect bots
- Consider email verification for testimonials
- Add CAPTCHA if spam becomes issue

---

## 10. Data Storage & Privacy

### Severity: 🟡 MEDIUM

**Current:** Testimonials stored in public GitHub repo

**Issues:**
- User names/testimonials are public
- No deletion mechanism
- No GDPR compliance

**Recommendations:**

```typescript
// Add privacy notice in form:
// "Your testimonial will be published on our website and GitHub repository"

// Add deletion endpoint:
// POST /api/delete-testimonial/{id}

// Clean PII before storage:
const sanitizeTestimonial = (data: any) => {
  // Remove email addresses if present
  data.testimonial = data.testimonial.replace(
    /[^\s@]+@[^\s@]+\.[^\s@]+/g, 
    '[email]'
  );
  return data;
};
```

---

## Security Checklist - Pre-Deployment

- [ ] Run `npm audit fix --force` and test thoroughly
- [ ] Add input validation to `api/submit-testimonial.ts`
- [ ] Implement error sanitization
- [ ] Add security headers (CSP, HSTS, etc.)
- [ ] Add rate limiting middleware
- [ ] Validate file uploads (size, type, count)
- [ ] Replace personal GitHub token with bot account
- [ ] Add logging sanitization
- [ ] Add CORS whitelist configuration
- [ ] Add privacy notice to testimonial form
- [ ] Set up error monitoring (Sentry/similar)
- [ ] Enable GitHub branch protection
- [ ] Review environment variable access logs
- [ ] Test for XSS vulnerabilities
- [ ] Run production build security check

---

## Recommended Security Tools

```bash
# OWASP Security Check
npm install -g @owasp/dependency-check

# Component scanning
npm install -D snyk

# Runtime monitoring (prod)
npm install @sentry/react @sentry/tracing

# Headers management
npm install csurf helmet

# Rate limiting
npm install express-rate-limit
```

---

## Conclusion

**Overall Security Posture:** 🟡 **MEDIUM** - Suitable for MVP with improvements

**Action Items by Priority:**
1. 🔴 **CRITICAL:** Resolve npm vulnerabilities
2. 🟠 **HIGH:** Add server-side input validation & sanitize errors
3. 🟡 **MEDIUM:** Add security headers, rate limiting, file validation
4. 🟢 **LOW:** Add monitoring and further hardening

**Next Steps:**
1. Create `api/middleware/security.ts` for common security functions
2. Create `api/middleware/validation.ts` for input validation
3. Update endpoint implementations
4. Run security test suite
5. Deploy with monitoring

---

*For questions or security concerns, please open a GitHub issue marked as "security".*
