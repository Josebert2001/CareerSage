# CareerSage — AI Career Counselor for African Students

> An intelligent career guidance platform bridging the gap between educational choices and professional reality for Nigerian and African students.

**Live Application**: [career-sage-beno.vercel.app](https://career-sage-beno.vercel.app)  
**Demo Video**: [YouTube](https://youtu.be/9agolZ_iPmU?si=8zuE99g20yRAp658)

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [Core Features](#core-features)
4. [Technology Stack](#technology-stack)
5. [System Architecture](#system-architecture)
6. [Cultural Context](#cultural-context)
7. [Development Guide](#development-guide)
8. [Security & Compliance](#security--compliance)
9. [Roadmap](#roadmap)

---

## Problem Statement

Career selection is one of the most consequential decisions African students face, yet most make this choice with minimal professional guidance. Traditional career counseling services are:

- **Geographically unavailable** — concentrated in private institutions in major cities
- **Financially inaccessible** — prohibitive costs for most families
- **Culturally misaligned** — generic frameworks ignore local realities (ASUU strikes, NYSC obligations, power infrastructure, economic constraints)
- **Academically inflexible** — no guidance accounting for polytechnic vs. university tradeoffs

CareerSage provides on-demand, culturally aware career counseling at scale.

---

## Solution Overview

CareerSage is a multimodal AI counseling system that generates personalized career roadmaps based on a student's actual constraints, interests, and aspirations — not idealized scenarios.

### Core Workflow

1. **7-step conversational intake** collects student profile (situation, interests, constraints, dreams, concerns, documents)
2. **Dual-pathway analysis** generates:
   - **Practical Pathway**: 6–18 month plan for immediate stability
   - **Growth Pathway**: 3–5 year vision for aspirational success
3. **Interactive results** with salary projections, market demand analysis, action steps, and career simulation

---

## Core Features

### Advisor Mode
Conversational intake form followed by structured career analysis. Each pathway includes:
- Monthly salary range projections (entry to senior levels)
- Market demand scoring (0–100 scale)
- Required technical and soft skills
- Education/certification options with timelines
- Actionable weekly steps (with local persistence)
- Risk assessment and realistic challenges

### Voice Counseling
Real-time conversational guidance via Gemini Live API with:
- Low-latency PCM audio streaming
- Interruption support
- Live web search grounding for current JAMB dates, scholarship deadlines, and job market data

### Career Simulator
Interactive roleplay scenarios ("day in the life") with:
- AI-generated narrative immersion
- Real-time scene editing (weather, location, tasks)
- Function-calling image generation for visual context

### Research Chat
Context-aware question answering with:
- Live web search for scholarships, tuition fees, job trends
- Source citation for fact verification
- Persistent conversation history

### Local Session Management
- Client-side storage via localStorage
- No backend authentication required
- Exportable session history

---

## Technology Stack

| Component | Technology |
|---|---|
| **Frontend Framework** | React 18 + TypeScript |
| **Styling** | Tailwind CSS (CDN) |
| **Build Tool** | Vite 5 |
| **Text & Reasoning** | Gemini 3.1 Pro Preview |
| **Image Generation** | Gemini 3 Pro Preview |
| **Voice/Audio** | Gemini 2.5 Flash Live API |
| **Search Agent** | Gemini 3 Flash with Google Search |
| **Data Visualization** | Recharts |
| **Icons** | Lucide React |
| **Hosting** | Vercel (frontend + serverless) |
| **CI/CD** | GitHub Actions |
| **Testimonials** | GitHub API (Octokit) |

---

## System Architecture

### Data Flow

```
User Input (Text / Voice / Documents)
           │
           ▼
    ┌──────────────┐
    │ Intake Form  │
    │  (7 Steps)   │
    └──────┬───────┘
           │
           ▼
    ┌──────────────────────┐
    │ Analysis Pipeline    │
    │ Gemini 3.1 Pro       │
    └──────┬───────────────┘
           │
      ┌────┴────┐
      ▼         ▼
   Practical  Growth
   Pathway    Pathway
   (parallel processing)
      │         │
      └────┬────┘
           │
           ▼
    ┌──────────────────┐
    │  Result View     │
    │ (Charts, Steps,  │
    │  Simulator)      │
    └──────────────────┘
```

### Processing Pipeline

**Stage 1: Profile Analysis**
- Structured JSON analysis of student profile
- Generation of two candidate career titles

**Stage 2: Parallel Pathway Expansion**
- Simultaneous processing of practical and growth pathways
- Full details: skills, timelines, salary data, education options, action steps

**Stage 3: Auxiliary Services**
- Voice conversations (independent agent)
- Web search & research (independent agent)
- Image generation for simulation scenes

This modular approach maintains UI responsiveness while leveraging parallel AI processing.

---

## Cultural Context

CareerSage is specifically calibrated for the West African education and employment landscape:

### Education Systems
- **JAMB/WAEC**: Understanding exam-based university admission
- **Polytechnic vs. University**: Addressing HND vs. BSc career implications
- **NECO**: Recognition of alternative certification pathways

### Economic & Social Realities
- **Financial constraints**: Acknowledges "money is tight" as a legitimate constraint
- **Family pressure**: Addresses tension between parental expectations and student aspirations
- **NYSC obligations**: Factors in Nigeria's mandatory national service year
- **Work-study tradeoffs**: Realistic guidance for part-time income needs
- **Infrastructure challenges**: Accounts for power instability and internet costs

### Labor Market Context
- **ASUU strikes**: Recognition of extended university closures
- **Remote income streams**: Emphasis on distributed work opportunities
- **Regional variation**: Salary and opportunity differences across Nigeria

---

## Development Guide

### Prerequisites

- Node.js 18 or later
- Google AI Studio API key ([obtain here](https://aistudio.google.com))

### Local Setup

```bash
git clone https://github.com/Josebert2001/CareerSage.git
cd CareerSage
npm install
```

Create `.env` (development):

```env
VITE_API_KEY=your_google_ai_studio_key
```

Run development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build
```

Output in `dist/`

### Environment Variables (Production)

| Variable | Purpose | Example |
|---|---|---|
| `VITE_API_KEY` | Google AI Studio key | `AIza...` |
| `GITHUB_TOKEN` | Testimonial endpoint auth | `ghp_...` |
| `GITHUB_OWNER` | Testimonial repo owner | `Josebert2001` |
| `GITHUB_REPO` | Testimonial repo name | `CareerSage` |
| `FRONTEND_URL` | CORS whitelisting | `https://career-sage-beno.vercel.app` |

### Continuous Integration

GitHub Actions on every push to `main`:

```
TypeScript type check → Build → Deploy to Vercel
```

---

## Security & Compliance

### Testimonial Submission API

The Vercel serverless endpoint (`/api/submit-testimonial`) implements:

- **Rate limiting**: 5 requests per minute per IP address (in-memory store)
- **Input validation**: Checks for SQL injection, XSS, and spam patterns
- **Sanitization**: Removes malicious scripts and encoding attacks
- **CORS enforcement**: Whitelisted domains only
- **Security headers**: 
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security: max-age=31536000`

### Data Handling

- All session data stored in browser localStorage — no backend database
- No user accounts or authentication required
- No personal data sent to third parties (except Gemini API for analysis)
- Testimonials anonymized before publication

---

## Roadmap

### Short Term (Q2 2026)
- Scholarship database with deadline filters and application status tracking
- Enhanced voice modality with emotion detection
- Offline-first mode for low-connectivity environments

### Medium Term (Q3-Q4 2026)
- Mentorship marketplace (students ↔ working professionals)
- Local language support (Yoruba, Igbo, Hausa, Ibibio)
- Mobile app (iOS + Android)

### Long Term
- Employer integration for direct job placement
- Skill assessment and certification recommendations
- Longitudinal tracking (alumni outcomes)

---

## About

**Builder**: Josebert   
**Background**: Cybersecurity student (University of Uyo, Nigeria) | IT Support Technician (6+ years)  
**Company**: [Jrsolvy](https://jrsolvy.com)

This project was created to address a real gap in career guidance for Nigerian students — a challenge I have personally navigated.

---

**License**: MIT
