# CareerSage — AI Career Counselor for African Students

> **Bridging the gap between dreams and reality for Nigerian and African students who never had access to a real career counselor.**

🔗 **Live App**: [career-sage-beno.vercel.app](https://career-sage-beno.vercel.app)  
📹 **Demo Video**: [Watch on YouTube](https://youtu.be/9agolZ_iPmU?si=8zuE99g20yRAp658)  
🏆 **Built for**: Octoverse Hackathon 2026

---

## The Problem

Across Nigeria and Africa, most students make one of the most important decisions of their lives — choosing a career — with almost no support. Generic quizzes don't account for ASUU strikes, NYSC obligations, power outages, or the financial pressure of supporting a family. Career counselors are rare, expensive, or simply unavailable at public universities.

CareerSage fixes that.

---

## What It Does

CareerSage is a multimodal AI career counseling system that understands the African student experience. It generates two personalized career roadmaps based on your real constraints — not a perfect life scenario.

### Features

**Smart Advisor**
Collects your situation through a conversational 7-step intake (name, current status, interests, constraints, dreams, fears, and documents). Generates two distinct career pathways:
- **Practical Pathway** (6–18 months): Quick wins and immediate stability
- **Growth Pathway** (3–5 years): Long-term vision and aspirational success

Each pathway includes salary range charts, market demand meters, action steps, education options, and realistic challenges.

**Voice Counseling**
Real-time voice conversation powered by the Gemini Live API with raw PCM audio streaming. Supports interruption, low latency, and real-time web search grounding for live data like JAMB dates and scholarship deadlines.

**Career Simulator**
Roleplay a "day in the life" of any career. AI generates narrative scenarios with function-calling image generation. Users can ask the AI to edit the scene in real time (e.g., "change the weather," "show a different office").

**Agentic Research Chat**
Ask questions about scholarships, tuition fees, job trends, and salaries. The agent uses live web search to verify facts and cite sources.

**Local Save System**
All sessions and roadmaps are saved to `localStorage` — no backend database, no accounts required.

**Testimonial System**
Users can submit testimonials via a Vercel serverless function that writes to a GitHub-hosted JSON file via the Octokit API. Includes rate limiting, input validation, and sanitization.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Tailwind CSS |
| AI — Text & Reasoning | Gemini 3.1 Pro Preview (`gemini-3-pro-preview`) |
| AI — Image Generation | Gemini 3 Pro Preview image generation (`gemini-3-pro-image-preview`) |
| AI — Voice | Gemini 2.5 Flash Live API — `gemini-2.5-flash-native-audio-preview-12-2025` |
| AI — Research Agent | Gemini 3 Flash Preview with Google Search grounding |
| AI — Simulation | Gemini 2.5 Flash image (`gemini-2.5-flash-image`) for scene editing |
| Data Visualization | Recharts |
| Icons | Lucide React |
| Deployment | Vercel (frontend + serverless API) |
| CI/CD | GitHub Actions |
| Testimonial Storage | GitHub API via Octokit |

---

## Architecture

```
User Input (Text / Voice / File Upload)
        │
        ▼
┌─────────────────────────────────────┐
│          Intake Form (7 Steps)       │
│  Name → Situation → Interests →     │
│  Constraints → Dreams → Fears → Docs│
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│        Strategy Engine              │
│   Gemini 3.1 Pro Preview            │
│   → Student Profile Analysis        │
│   → Pathway Title Generation        │
└──────────┬──────────────────────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
Practical    Growth
Pathway      Pathway
(parallel    (parallel
 generation)  generation)
     │           │
     └─────┬─────┘
           │
           ▼
┌─────────────────────────────────────┐
│        Result View                  │
│  Reflection → Salary Charts →       │
│  Action Steps → Simulator Launch    │
└─────────────────────────────────────┘
```

### Multi-Agent Workflow

The app uses a 3-stage pipeline:

1. **Analysis Stage**: A structured JSON call analyzes the student's profile and determines two career titles.
2. **Pathway Generation Stage**: Two parallel calls expand each title into a full pathway with skills, timeline, salary data, and action steps.
3. **Research/Voice Stage**: Separate agents handle live search and voice independently.

This modular approach keeps the UI responsive while heavy AI processing happens in parallel.

---

## Africa-Specific Context

CareerSage is specifically tuned to understand:

- **Education systems**: JAMB, WAEC, NECO, and the HND vs BSc dichotomy between polytechnics and universities
- **Economic realities**: Power instability, internet costs, and the need for remote income streams
- **NYSC**: Nigeria's mandatory national service year and how to plan a career around it
- **ASUU strikes**: The reality of extended university closures at public institutions
- **Financial constraints**: Advice that works when "money is tight right now" is a real option, not an edge case

---

## Local Development

### Prerequisites

- Node.js 18+
- A Google AI Studio API key ([get one here](https://aistudio.google.com))

### Setup

```bash
git clone https://github.com/Josebert2001/CareerSage.git
cd CareerSage
npm install
```

Create a `.env` file:

```env
VITE_API_KEY=your_google_ai_api_key_here
```

```bash
npm run dev
```

### Environment Variables (Production)

| Variable | Description |
|---|---|
| `VITE_API_KEY` | Google AI Studio API key |
| `GITHUB_TOKEN` | Personal access token for testimonial writes |
| `GITHUB_OWNER` | GitHub username (default: Josebert2001) |
| `GITHUB_REPO` | Repo name (default: CareerSage) |
| `FRONTEND_URL` | Production frontend URL for CORS |

### CI/CD

GitHub Actions runs on every push to `main`:
1. TypeScript type check (`tsc --noEmit`)
2. Production build
3. Automatic deploy to Vercel

---

## Security Notes

The Vercel serverless API (`/api/submit-testimonial`) includes:
- Rate limiting (5 requests per minute per IP, in-memory)
- Input validation and sanitization (SQL injection, XSS, spam pattern detection)
- CORS whitelisting
- Security headers (X-Content-Type-Options, X-Frame-Options, HSTS, etc.)

---

## What's Next

- Scholarship finder with deadline filters
- Mentorship marketplace connecting students with working professionals
- Local language support (Yoruba, Igbo, Hausa, Ibibio)
- Mobile app version
- Offline-first mode for low-connectivity environments

---

## About the Builder

Built by **Josebert Robert** — Cybersecurity student at the University of Uyo, Nigeria. Founder of [Jrsolvy](https://jrsolvy.com). IT Support Technician with 6+ years of hands-on experience.

This project was built because the career guidance gap in Nigeria is real — and I've lived it.

---

*Submitted to the Octoverse Hackathon 2026.*
