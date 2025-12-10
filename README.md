
# CareerSage - AI Career Counselor

**Empowering students in Nigeria & Africa with realistic, human-centered career guidance.**

CareerSage is a next-generation career counseling platform built with **Gemini 3 Pro** and **Gemini Live**. It moves beyond generic personality quizzes to provide deep, narrative-driven guidance that respects the user's cultural context, financial reality, and personal story.

## 🌟 Key Features

### 🧠 Gemini 3 Pro Intelligence
- **Advanced Reasoning**: Uses `gemini-3-pro-preview` to analyze complex user stories, uploaded transcripts, and personal constraints.
- **Dual-Pathway System**: Generates two distinct plans:
  - **Practical Pathway**: A "Start Now" plan (6-18 months) for immediate stability.
  - **Growth Pathway**: An aspirational vision (3-5 years) for long-term fulfillment.
- **Human-First UX**: Includes a "What I Heard" reflection step to ensure the user feels understood before advice is given.

### 🎙️ Live Voice Consultation (Gemini Live)
- **Real-Time Conversation**: Users can talk to CareerSage naturally using the **Gemini Live API** (Multimodal Audio).
- **Search Grounding**: The voice assistant uses **Google Search** tools to answer real-time questions (e.g., "When is the next JAMB exam?", "Current exchange rates").
- **Low Latency**: Built on WebSocket technology for fluid, interruption-friendly dialogue.

### 📄 Multimodal Analysis
- **Document Upload**: Users can upload images of transcripts, CVs, or handwritten notes.
- **Visual Understanding**: Gemini analyzes these documents to extract grades and skills automatically.

### 📊 Visual & Interactive Results
- **Dynamic Charts**: Visualizes Salary Ranges and Market Demand using Recharts.
- **Progress Tracking**: "Start This Week" action steps feature persistent checkboxes to track real-life progress.
- **Reality Checks**: Dedicated sections for "Hard Truths" about specific career paths in the African context.

## 🛠️ Tech Stack

- **Core AI**: Google Gemini 3 Pro Preview (`gemini-3-pro-preview`)
- **Voice AI**: Gemini Live API (`gemini-2.5-flash-native-audio`)
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Visualization**: Recharts
- **Icons**: Lucide React
- **Architecture**: Client-side SPA (Single Page Application) with ES Modules.

## 🚀 Getting Started

### Prerequisites
- A **Google Gemini API Key** with access to `gemini-3-pro-preview`.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/careersage.git
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment**:
   Create a `.env` file in the root:
   ```env
   API_KEY=your_gemini_api_key_here
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 🌍 Cultural Context

CareerSage is specifically tuned for the **Nigerian/African** market. It understands:
- **Education Systems**: JAMB, WAEC, NECO, Poly vs. University (HND/BSc).
- **Economic Realities**: Inflation, side hustles, remote work opportunities.
- **Infrastructure**: Power/Internet constraints impacting career choices.

## 🛡️ Privacy & Safety

- **Client-Side Processing**: User data is processed directly via the API; no intermediate database storage.
- **Disclaimer**: The app clearly states it provides educational guidance, not professional legal or financial advice.

---

**Built for the "Vibe Code with Gemini 3 Pro" Hackathon**
