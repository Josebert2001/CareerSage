import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ANALYSIS_PROMPT } from "../constants";
import { CareerAdviceResponse, FileData, Pathway } from "../types";

const apiKey = process.env.API_KEY;

// --- SCHEMAS ---

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    studentProfile: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING, description: "A concise summary of the student's profile (max 100 words)." },
        keyStrengths: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["summary", "keyStrengths"]
    },
    contextAnalysis: { type: Type.STRING, description: "Analysis of their situation and constraints." },
    practicalPathTitle: { type: Type.STRING, description: "Title of the realistic, near-term career path." },
    growthPathTitle: { type: Type.STRING, description: "Title of the aspirational, long-term career path." },
    reasoning: { type: Type.STRING, description: "Why these two paths were chosen." }
  },
  required: ["studentProfile", "contextAnalysis", "practicalPathTitle", "growthPathTitle", "reasoning"]
};

const pathwaySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    fitReason: { type: Type.STRING, description: "Why this fits the user (max 2 sentences)." },
    requiredSkills: {
      type: Type.OBJECT,
      properties: {
        technical: { type: Type.ARRAY, items: { type: Type.STRING } },
        soft: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["technical", "soft"]
    },
    educationOptions: { type: Type.ARRAY, items: { type: Type.STRING } },
    timeline: { type: Type.STRING, description: "e.g., '6-12 months'" },
    challenges: { type: Type.ARRAY, items: { type: Type.STRING } },
    actionSteps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 concrete starting steps." },
    marketReality: { type: Type.STRING, description: "Current demand and job availability." },
    salaryRange: {
      type: Type.OBJECT,
      properties: {
        min: { type: Type.NUMBER },
        max: { type: Type.NUMBER },
        currency: { type: Type.STRING, description: "Local currency code e.g. NGN, USD" }
      },
      required: ["min", "max", "currency"]
    },
    demandScore: { type: Type.NUMBER, description: "0 to 100" },
    growthScore: { type: Type.NUMBER, description: "0 to 100" }
  },
  required: ["title", "fitReason", "requiredSkills", "educationOptions", "timeline", "challenges", "actionSteps", "marketReality", "salaryRange", "demandScore", "growthScore"]
};

export const generateCareerAdvice = async (
  textInput: string,
  files: FileData[]
): Promise<CareerAdviceResponse> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = "gemini-2.5-flash"; // Flash is faster and supports strict JSON well

  // Prepare input parts
  const analysisParts: any[] = [];
  if (files && files.length > 0) {
    files.forEach(file => {
      analysisParts.push({
        inlineData: { mimeType: file.mimeType, data: file.data }
      });
    });
  }
  analysisParts.push({ text: `Student Scenario: ${textInput}` });

  // --- STEP 1: ANALYSIS ---
  let analysisResult: any;
  try {
    console.log("Step 1: Analyzing Profile...");
    const analysisResponse = await ai.models.generateContent({
      model: modelName,
      contents: { role: "user", parts: analysisParts },
      config: {
        systemInstruction: ANALYSIS_PROMPT,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.3,
      }
    });

    if (!analysisResponse.text) throw new Error("Empty response from AI");
    analysisResult = JSON.parse(analysisResponse.text);
  } catch (error) {
    console.error("Step 1 Failed:", error);
    throw new Error("Failed to analyze profile. Please try again.");
  }

  // --- STEP 2 & 3: PATHWAY GENERATION (PARALLEL) ---
  console.log("Step 2: Generating Pathways...");
  
  const generatePathway = async (title: string, type: 'Practical' | 'Growth'): Promise<Pathway> => {
    const prompt = `
      Create a detailed ${type} Career Pathway for the role: "${title}".
      
      Student Context:
      ${JSON.stringify(analysisResult.studentProfile)}
      ${analysisResult.contextAnalysis}
      
      Requirements:
      - Be realistic for the African/Nigerian context if applicable.
      - Estimate salary ranges in local currency based on your knowledge.
      - Keep text concise and actionable.
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { role: "user", parts: [{ text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: pathwaySchema,
        temperature: 0.4,
      }
    });
    
    return JSON.parse(response.text!) as Pathway;
  };

  try {
    const [practicalPathway, growthPathway] = await Promise.all([
      generatePathway(analysisResult.practicalPathTitle, 'Practical'),
      generatePathway(analysisResult.growthPathTitle, 'Growth')
    ]);

    return {
      studentProfile: analysisResult.studentProfile,
      contextAnalysis: analysisResult.contextAnalysis,
      practicalPathway,
      growthPathway,
      closingMessage: "Your personalized career roadmap is ready. Remember, these are starting points—your journey is yours to define."
    };

  } catch (error) {
    console.error("Step 2 Failed:", error);
    // Fallback if one pathway fails - highly unlikely with strict schema, but good practice
    throw new Error("Failed to generate detailed pathways. Please try again.");
  }
};
