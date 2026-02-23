// This is a guide for setting up the testimonial submission backend
// You can implement this using:
// 1. Vercel Functions (serverless)
// 2. Express/Node.js backend
// 3. GitHub Actions workflow

// Example implementation using Vercel Functions:
// Create /api/submit-testimonial.ts

import { Octokit } from "@octokit/rest";

const github = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, role, testimonial, date } = req.body;

  try {
    // Fetch current testimonials.json
    const { data: fileData } = await github.repos.getContent({
      owner: process.env.GITHUB_OWNER || "Josebert2001",
      repo: process.env.GITHUB_REPO || "CareerSage",
      path: "testimonials.json",
    });

    const currentContent = JSON.parse(
      Buffer.from(fileData.content, "base64").toString()
    );

    // Add new testimonial
    const newTestimonial = {
      id: Math.max(...currentContent.testimonials.map((t: any) => t.id)) + 1,
      name,
      role,
      testimonial,
      date,
    };

    currentContent.testimonials.push(newTestimonial);

    // Commit updated file
    await github.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER || "Josebert2001",
      repo: process.env.GITHUB_REPO || "CareerSage",
      path: "testimonials.json",
      message: `Add testimonial from ${name}`,
      content: Buffer.from(JSON.stringify(currentContent, null, 2)).toString(
        "base64"
      ),
      sha: fileData.sha,
    });

    res.status(200).json({ success: true, testimonial: newTestimonial });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to submit testimonial" });
  }
}
