
# CareerSage - AI Career Counselor

**Empowering students in Nigeria & Africa with realistic, human-centered career guidance.**

CareerSage is a next-generation career counseling platform built with the latest **Google Gemini Models**. It moves beyond generic personality quizzes to provide deep, narrative-driven guidance that respects the user's cultural context, financial reality, and personal story.

## 🌟 Key Features

### 1. 🧠 Smart Advisor (Gemini 3 Pro)
The core planning engine that analyzes your profile to create a comprehensive roadmap.
- **Deep Reasoning**: Uses `gemini-3-pro-preview` to analyze complex user stories, constraints, and uploaded documents (CVs, transcripts).
- **Dual-Pathway System**: Generates two distinct plans:
  - **Practical Pathway**: A "Start Now" plan (6-18 months) for immediate stability.
  - **Growth Pathway**: An aspirational vision (3-5 years) for long-term fulfillment.
- **Visual Analytics**: Dynamic charts for Salary Ranges and gauges for Market Demand.
- **Future Vision**: Uses `gemini-3-pro-image-preview` to generate a photorealistic "Polaroid" of your future self in the role to inspire confidence.

### 2. 🎙️ Voice Mode (Gemini Live)
Have a natural, real-time conversation with an empathetic career counselor.
- **Multimodal Audio**: Powered by `gemini-2.5-flash-native-audio-preview`.
- **Context Aware**: Reads your profile setup to ask relevant questions.
- **Search Grounding**: The voice assistant can look up real-time facts (e.g., "When is the next JAMB exam?", "Current exchange rates") during the call.
- **Low Latency**: Built on WebSocket technology for fluid, interruption-friendly dialogue.

### 3. 🎮 Career Simulator (Flash 2.5 + Image)
Experience a "Day in the Life" of any job before you commit.
- **Interactive Roleplay**: `gemini-2.5-flash` orchestrates realistic workplace scenarios based on the user's context.
- **Generative Visuals**: Uses `gemini-2.5-flash-image` (Nano Banana) to generate images of the workplace or tasks on the fly (e.g., "Show me the broken circuit board").
- **Image Editing**: Users can refine the simulation visuals using natural language (e.g., "Add a retro filter", "Remove the person in the background").

### 4. 🕵️ Agentic Chat (Research)
A dedicated research assistant for specific queries.
- **Fact-Checking**: Uses **Google Search** tools to verify scholarship deadlines, tuition fees, and job market trends.
- **Source Citations**: Provides direct links to verified sources.

### 5. 💾 Session History
- **Local Storage**: Automatically saves your Advisor plans and Chat sessions.
- **Restore**: revisit previous advice or continue a research chat later.

## 🛠️ Tech Stack

- **Reasoning**: `gemini-3-pro-preview`
- **Voice/Audio**: `gemini-2.5-flash-native-audio-preview-09-2025`
- **High-Fidelity Images**: `gemini-3-pro-image-preview`
- **Fast Multimodal (Text/Image)**: `gemini-2.5-flash` & `gemini-2.5-flash-image`
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Visualization**: Recharts
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites
- A **Google Gemini API Key** with access to the models listed above.

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
