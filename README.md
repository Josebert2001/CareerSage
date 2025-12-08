# CareerSage - AI Career Counselor

CareerSage is an AI-powered career counseling application designed to help students—particularly in Nigeria and Africa—make informed, realistic decisions about their futures. 

Unlike generic career tools, CareerSage prioritizes deep narrative understanding, cultural context (considering local education systems like JAMB/WAEC, NYSC, and economic realities), and provides a dual-pathway recommendation system.

## 🚀 Features

- **Deep Contextual Analysis**: Moves beyond personality quizzes to understand the student's full story, financial constraints, and family dynamics.
- **Dual-Pathway System**:
  - **Practical Pathway**: A realistic, near-term option (6-24 months) focusing on immediate stability and achievable skills.
  - **Growth Pathway**: A long-term, aspirational vision (3-5+ years) aligning with deep passions and high-level goals.
- **Document Analysis**: Capable of analyzing uploaded transcripts, CVs, and personal statements to inform advice.
- **Region-Aware Guidance**: Specifically tuned for the African context, accounting for infrastructure challenges, local job markets, and migration realities.
- **Actionable Steps**: Provides immediate, concrete "Start This Week" tasks rather than vague motivation.

## 🛠️ Tech Stack

- **Frontend**: React 18
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI Model**: Google Gemini API (`gemini-3-pro-preview`)
- **Build/Runtime**: ES Modules via Import Maps (No-build setup compatible) / Vite-ready structure.

## 📂 Project Structure

```
├── components/
│   ├── InputForm.tsx       # User input handling (Text + File Uploads)
│   ├── ResultView.tsx      # Displays the analysis (Accordions, Pathways)
│   ├── LoadingScreen.tsx   # Animated loading state with helpful tips
│   └── ...
├── services/
│   └── geminiService.ts    # Integration with Google GenAI SDK
├── constants.ts            # System prompts and configuration
├── types.ts                # TypeScript interfaces
├── App.tsx                 # Main application controller
├── index.tsx               # Entry point
└── index.html              # HTML shell with Import Maps
```

## ⚡ Getting Started

### Prerequisites
- Node.js (if running locally via Vite/Webpack) or a modern browser.
- A valid **Google Gemini API Key**.

### Environment Setup

The application requires an API key to function. This is accessed via `process.env.API_KEY`.

1. Get your API key from [Google AI Studio](https://aistudio.google.com/).
2. Ensure the key has access to the `gemini-3-pro-preview` model.

### Running the Project

If utilizing a standard Vite setup:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Dev Server**:
   ```bash
   npm run dev
   ```

3. **Open in Browser**:
   Navigate to `http://localhost:5173`.

## 🧠 AI Logic

CareerSage uses a sophisticated prompt engineering strategy defined in `constants.ts`. It instructs the AI to:
1. **Sanitize Inputs**: Review user text and files.
2. **Reject Stereotypes**: Avoid generic advice based solely on gender or simple keywords.
3. **Output Structured JSON**: Returns data strictly matching the `CareerAdviceResponse` schema, ensuring the UI can render specific sections like "Required Skills" and "Market Reality" consistently.

## ⚠️ Disclaimer

CareerSage provides guidance for educational purposes only. It does not constitute professional financial, legal, or binding career advice. Users are encouraged to verify information with local institutions and professionals.

---

**Powered by Google Gemini**
