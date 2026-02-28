import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Octokit } from "@octokit/rest";
import {
  addSecurityHeaders,
  validateOrigin,
  checkRateLimit,
  sanitizeError,
  safeLog,
} from "./middleware/security";
import {
  validateTestimonial,
  sanitizeText,
  type TestimonialInput,
} from "./middleware/validation";

interface StoredTestimonial {
  name: string;
  role: string;
  testimonial: string;
  date: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ── Security headers ─────────────────────────────────────────────────────
  addSecurityHeaders(res);

  // ── CORS ─────────────────────────────────────────────────────────────────
  const origin = req.headers.origin as string | undefined;
  if (origin && validateOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") return res.status(204).end();

  // ── Method check ─────────────────────────────────────────────────────────
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ── Rate-limit (by IP) ──────────────────────────────────────────────────
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
    "unknown";
  if (!checkRateLimit(ip, 5, 60_000)) {
    return res
      .status(429)
      .json({ error: "Too many requests. Please wait before trying again." });
  }

  try {
    // ── Validate body ────────────────────────────────────────────────────
    const body = req.body as TestimonialInput;
    const errors = validateTestimonial(body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // ── Sanitise inputs ──────────────────────────────────────────────────
    const sanitizedTestimonial: StoredTestimonial = {
      name: sanitizeText(body.name as string),
      role: sanitizeText(body.role as string),
      testimonial: sanitizeText(body.testimonial as string),
      date: new Date(body.date as string).toISOString().split("T")[0],
    };

    // ── GitHub token check ───────────────────────────────────────────────
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      safeLog("submit-testimonial", "GITHUB_TOKEN is missing");
      return res.status(500).json({ error: "Server configuration error" });
    }

    const owner = process.env.GITHUB_OWNER ?? "Josebert2001";
    const repo = process.env.GITHUB_REPO ?? "CareerSage";
    const path = "testimonials.json";
    const branch = process.env.GITHUB_BRANCH ?? "main";

    const octokit = new Octokit({ auth: token });

    // ── Read current file ────────────────────────────────────────────────
    let existingTestimonials: StoredTestimonial[] = [];
    let fileSha: string | undefined;

    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch,
      });

      if ("content" in data && data.content) {
        const decoded = Buffer.from(data.content, "base64").toString("utf-8");
        existingTestimonials = JSON.parse(decoded);
        fileSha = data.sha;
      }
    } catch (err: unknown) {
      // File might not exist yet – that's fine
      if ((err as { status?: number }).status !== 404) throw err;
    }

    // ── Append & write ───────────────────────────────────────────────────
    existingTestimonials.push(sanitizedTestimonial);

    const updatedContent = Buffer.from(
      JSON.stringify(existingTestimonials, null, 2),
      "utf-8"
    ).toString("base64");

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `feat: add testimonial from ${sanitizedTestimonial.name}`,
      content: updatedContent,
      ...(fileSha ? { sha: fileSha } : {}),
      branch,
    });

    return res.status(201).json({
      success: true,
      message: "Testimonial submitted successfully!",
    });
  } catch (err) {
    safeLog("submit-testimonial", err);
    return res.status(500).json({ error: sanitizeError(err) });
  }
}
