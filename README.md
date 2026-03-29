
# CareerSage - AI Career Counselor

**Bridging the gap between dreams and reality for students in Africa and beyond.**

CareerSage is a comprehensive AI career guidance system built on the **Google Gemini 3** ecosystem. It provides culturally aware, realistic career paths using deep reasoning, multimodality, and real-time data grounding.

---

## 🚀 Advanced Architecture

CareerSage uses a multi-model orchestration strategy to deliver a high-fidelity experience:

### 1. The Strategy Engine (Gemini 3 Pro)
The core "Advisor" uses **`gemini-3-pro-preview`** to process complex inputs, including CVs and academic transcripts. It generates a "Dual-Pathway" roadmap:
- **Practical Route**: Focused on 6-12 month employability.
- **Growth Route**: Focused on 3-5 year aspirational success.

### 2. The Job Simulator (Pro + Flash Image)
Experience a "Day in the Life" of any profession.
- **Narrative Logic**: Powered by **`gemini-3-pro-preview`** for high-stakes decision branching.
- **Visuals**: Powered by **`gemini-2.5-flash-image`** for on-the-fly workplace visualization and interactive editing (e.g., "Change the weather in the scene").

### 3. Voice Mode (Live API)
Talk naturally with an empathetic counselor.
- **Model**: **`gemini-2.5-flash-native-audio-preview-12-2025`**.
- **Features**: Interruption-friendly, low-latency raw PCM audio streaming with Google Search grounding.

### 4. Agentic Research (Search Tool)
Verify facts about scholarships, schools, and salaries.
- **Model**: **`gemini-3-pro-preview`** with **`googleSearch`** integration.

---

## 🛠️ Technical Setup

### Prerequisites
- Node.js 18+
- Gemini API Key with access to Gemini 3 series models.

### Environment Variables
The application expects an `API_KEY` in the execution environment.

### Simulator Troubleshooting
If the simulation images do not appear:
1. Ensure your API key has access to the `gemini-2.5-flash-image` model.
2. The simulator requires a valid function-calling handshake. CareerSage handles this using the latest SDK protocols including `functionCall.id` mapping.

---

## 🌍 Social Impact: The Africa Focus
CareerSage is specifically tuned to understand:
- **Education Systems**: JAMB, WAEC, NECO, and the dichotomy between Polytechnic (HND) and University (BSc).
- **Economic Realities**: Power instability, internet costs, and the need for remote side-hustles.
- **NYSC**: The mandatory service year in Nigeria and how to plan around it.

---
*Built for the Google Gemini Build Challenge.*
