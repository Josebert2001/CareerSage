
# 🏆 Hackathon Submission Kit

Use the materials below to submit your project to the "Google DeepMind - Vibe Code with Gemini 3 Pro" Hackathon.

---

## 1. Kaggle Writeup (Max 250 Words)

**Title:** CareerSage: Context-Aware Career Guidance for Africa
**Subtitle:** Bridging the guidance gap with Gemini 3 Pro's reasoning and cultural awareness.
**Track:** Education / Social Impact

**Project Description:**
In Africa, the student-to-counselor ratio often exceeds 3,000:1, leaving millions navigating their future blind. Generic AI tools fail here—they don't understand JAMB exams, HND/BSc distinctions, or the economic realities of the region.

**CareerSage** is a culturally aware AI counselor built on **Gemini 3 Pro**.

It goes beyond simple text generation:
1.  **Deep Reasoning:** We use `gemini-3-pro-preview` to analyze complex user profiles and uploaded documents (CVs, transcripts), generating two distinct pathways: a "Practical" route for immediate stability and a "Growth" route for long-term aspiration.
2.  **Multimodal Simulation:** The app features a "Day in the Life" simulator powered by `gemini-2.5-flash` and `gemini-2.5-flash-image`, allowing students to roleplay jobs and visualize their workspace before committing.
3.  **Voice Mode:** Powered by the **Gemini Live API** (`gemini-2.5-flash-native-audio`), it provides accessible, real-time voice guidance for users who prefer conversation over text.

CareerSage demonstrates how Gemini 3's reasoning capabilities can be applied to solve deep, structural problems in education, offering personalized hope and strategy to the next generation of African talent.

---

## 2. Video Demo Script (2 Minutes)

**Goal:** Show Impact, Tech Depth, and "Wow" factor.

**[0:00 - 0:20] The Problem & Hook**
*   *Visual:* Show the app landing page.
*   *Voiceover:* "For millions of students in Nigeria and across Africa, career guidance is a luxury. Generic AI gives generic advice that ignores local realities like JAMB exams or economic constraints. Enter CareerSage."

**[0:20 - 0:50] Feature 1: The Advisor (Gemini 3 Pro Reasoning)**
*   *Action:* Upload a dummy transcript/CV image in the input form. Fill out the profile quickly.
*   *Visual:* Show the "Analyzing..." screen, then the Results dashboard. Point out the "Practical" vs "Growth" pathways.
*   *Voiceover:* "Powered by **Gemini 3 Pro's** advanced reasoning, CareerSage analyzes documents and context to build a dual-pathway strategy: one for immediate stability, and one for long-term growth. It understands the local context perfectly."

**[0:50 - 1:25] Feature 2: The Simulator (Multimodality)**
*   *Action:* Click "Simulate" on a job role. Type "Design a logo" or "Show me the office".
*   *Visual:* Show the chat generating an image using Gemini Flash Image. Then type "Add a retro filter" to show the editing capability.
*   *Voiceover:* "We don't just tell you about a job; we let you live it. Using **Gemini 2.5 Flash** for orchestration and **Flash Image** for generation, students can roleplay a day in the life. They can even edit the simulation visuals using natural language commands."

**[1:25 - 1:50] Feature 3: Voice Mode (Live API)**
*   *Action:* Switch to Voice Mode. Speak: "I'm worried about my JAMB score."
*   *Visual:* Show the visualizer reacting.
*   *Voiceover:* "For true accessibility, we use the **Gemini Live API**. It offers low-latency, empathetic voice guidance that grounds responses in real-time data using Google Search tools."

**[1:50 - 2:00] Closing**
*   *Visual:* Show the "Future Self" polaroid generating.
*   *Voiceover:* "CareerSage isn't just a chatbot. It's a comprehensive guidance system built on the full power of Gemini. Thank you."

---

## 3. How to Submit

1.  **Deploy Code:** Copy your `index.tsx`, `App.tsx`, and other files into the **Google AI Studio Build** environment if you haven't already.
2.  **Record Video:** Use a screen recorder (like Loom or OBS) to follow the script above.
3.  **Publish App:** In AI Studio, click "Share" -> "Publish App" to get your public link.
4.  **Kaggle:** Go to the hackathon page, click "New Writeup", paste the text above, link your video and app.
