import { Octokit } from "@octokit/rest";
import { VercelRequest, VercelResponse } from "@vercel/node";
import {
  addSecurityHeaders,
  validateOrigin,
  sanitizeError,
  safeLog,
  checkRateLimit,
} from "./middleware/security";
import {
  validateTestimonial,
  sanitizeTestimonial,
  formatValidationErrors,
} from "./middleware/validation";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Add security headers to response
  addSecurityHeaders(res);

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // CORS validation
  const origin = req.headers.origin;
  if (!validateOrigin(origin)) {
    return res.status(403).json({ error: "Origin not allowed" });
  }

  // Rate limiting (by IP + endpoint)
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  const rateLimitKey = `testimonial:${clientIp}`;

  if (!checkRateLimit(rateLimitKey, 5, 3600000)) {
    // Max 5 testimonials per IP per hour
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  // Input validation
  const validationErrors = validateTestimonial(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({
      error: "Validation failed",
      details: formatValidationErrors(validationErrors),
    });
  }

  // Sanitize input data
  const sanitized = sanitizeTestimonial(req.body);

  try {
    // Verify environment variables
    if (!process.env.GITHUB_TOKEN) {
      safeLog("testimonial-submit", "Missing GITHUB_TOKEN");
      return res.status(500).json({ error: sanitizeError("Missing configuration") });
    }

    const github = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    const owner = process.env.GITHUB_OWNER || "Josebert2001";
    const repo = process.env.GITHUB_REPO || "CareerSage";

    // Fetch current testimonials.json
    let fileData;
    try {
      const response = await github.repos.getContent({
        owner,
        repo,
        path: "testimonials.json",
      });
      fileData = response.data as any;
    } catch (error) {
      safeLog("testimonial-submit", `Failed to fetch testimonials.json from ${owner}/${repo}`);
      return res.status(500).json({ error: sanitizeError(error) });
    }

    // Parse current content
    let currentContent;
    try {
      currentContent = JSON.parse(
        Buffer.from(fileData.content, "base64").toString()
      );
    } catch (error) {
      safeLog("testimonial-submit", "Failed to parse testimonials.json");
      return res
        .status(500)
        .json({ error: sanitizeError("Failed to process testimonials") });
    }

    // Validate structure
    if (!Array.isArray(currentContent.testimonials)) {
      safeLog("testimonial-submit", "Invalid testimonials structure");
      return res
        .status(500)
        .json({ error: sanitizeError("Invalid testimonials structure") });
    }

    // Add new testimonial
    const newId =
      currentContent.testimonials.length > 0
        ? Math.max(...currentContent.testimonials.map((t: any) => t.id || 0)) + 1
        : 1;

    const newTestimonial = {
      id: newId,
      name: sanitized.name,
      role: sanitized.role,
      testimonial: sanitized.testimonial,
      date: sanitized.date || new Date().toISOString().split("T")[0],
    };

    currentContent.testimonials.push(newTestimonial);

    // Commit updated file
    try {
      await github.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: "testimonials.json",
        message: `Add testimonial (ID: ${newId})`,
        content: Buffer.from(JSON.stringify(currentContent, null, 2)).toString("base64"),
        sha: fileData.sha,
      });
    } catch (error) {
      safeLog("testimonial-submit", `Failed to commit to GitHub`, false);
      return res.status(500).json({ error: sanitizeError(error) });
    }

    return res.status(200).json({
      success: true,
      message: "Testimonial submitted successfully",
      testimonial: newTestimonial,
    });
  } catch (error) {
    safeLog("testimonial-submit", error, true);
    return res.status(500).json({
      error: sanitizeError(error),
    });
  }
}
