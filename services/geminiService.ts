import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ANALYSIS_PROMPT, RESEARCH_PROMPT } from "../constants";
import { CareerAdviceResponse, FileData } from "../types";

const apiKey = process.env.API_KEY;

// Schema for Step 1 (Analysis)
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    studentProfile: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        keyStrengths: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    contextAnalysis: { type: Type.STRING },
    practicalPathTitle: { type: Type.STRING },
    growthPathTitle: { type: Type.STRING },
    reasoning: { type: Type.STRING }
  },
  required: ["studentProfile", "contextAnalysis", "practicalPathTitle", "growthPathTitle"]
};

export const generateCareerAdvice = async (
  textInput: string,
  files: FileData[]
): Promise<CareerAdviceResponse> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // --- STEP 1: The Counselor (Gemini 3 Pro) ---
  // Purpose: Deep Reasoning & OCR
  const analysisParts: any[] = [];
  if (files && files.length > 0) {
    files.forEach(file => {
      analysisParts.push({
        inlineData: { mimeType: file.mimeType, data: file.data }
      });
    });
  }
  analysisParts.push({ text: `Student Scenario: ${textInput}` });

  let analysisResult: any;

  try {
    const analysisResponse = await ai.models.generateContent({
      model: "gemini-3-pro-preview", 
      contents: { role: "user", parts: analysisParts },
      config: {
        systemInstruction: ANALYSIS_PROMPT,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.5,
      }
    });

    const cleanJson = analysisResponse.text ? analysisResponse.text.replace(/```json\n?|```/g, '').trim() : "{}";
    analysisResult = JSON.parse(cleanJson);
  } catch (e) {
    console.error("Step 1 Analysis Failed", e);
    throw new Error("Failed to analyze profile.");
  }

  // --- STEP 2: The Researcher (Gemini 2.5 Flash) ---
  // Purpose: Search Grounding & Data Gathering
  const researchPromptFormatted = RESEARCH_PROMPT
    .replace("[INSERT_PRACTICAL_TITLE]", analysisResult.practicalPathTitle)
    .replace("[INSERT_GROWTH_TITLE]", analysisResult.growthPathTitle);

  const researchParts = [{
    text: `
      CONTEXT FROM STEP 1:
      Student Profile: ${JSON.stringify(analysisResult.studentProfile)}
      Context: ${analysisResult.contextAnalysis}
      
      GENERATE FULL ADVICE NOW.
    `
  }];

  try {
    const researchResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Flash is best for Search tools
      contents: { role: "user", parts: researchParts },
      config: {
        systemInstruction: researchPromptFormatted,
        // Strict JSON schema is NOT supported with Search tool, so we rely on prompt engineering + manual parse
        tools: [{ googleSearch: {} }], 
        temperature: 0.3, 
      }
    });

    let finalText = researchResponse.text || "{}";
    // Sanitize
    finalText = finalText.replace(/```json\n?|```/g, '').trim();
    // Sometimes the model adds text before the JSON in search mode, try to find the first { and last }
    const firstBrace = finalText.indexOf('{');
    const lastBrace = finalText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      finalText = finalText.substring(firstBrace, lastBrace + 1);
    }

    const finalData = JSON.parse(finalText) as CareerAdviceResponse;

    // Extract sources
    const sources = researchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        title: chunk.web?.title || "Reference",
        uri: chunk.web?.uri || ""
      }))
      .filter((s: any) => s.uri !== "");

    // Merge the Step 1 deep profile (which might be better) with Step 2 data if Step 2 was lazy
    if (!finalData.studentProfile || finalData.studentProfile.summary.length < 10) {
        finalData.studentProfile = analysisResult.studentProfile;
    }
    finalData.sources = sources;

    return finalData;

  } catch (error) {
    console.error("Step 2 Research Failed", error);
    throw error;
  }
};
