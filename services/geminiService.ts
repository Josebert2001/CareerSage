
import { GoogleGenAI, Type, Schema, ChatSession as GenAIChatSession } from "@google/genai";
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
    reflection: { type: Type.STRING, description: "A 'What I Heard' section reflecting the user's story back to them." },
    practicalPathTitle: { type: Type.STRING, description: "Title of the realistic, near-term career path." },
    growthPathTitle: { type: Type.STRING, description: "Title of the aspirational, long-term career path." },
    reasoning: { type: Type.STRING, description: "Why these two paths were chosen." }
  },
  required: ["studentProfile", "contextAnalysis", "reflection", "practicalPathTitle", "growthPathTitle", "reasoning"]
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
    realityCheck: { type: Type.STRING, description: "A grounded 'Reality Check' regarding common traps or local context." },
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
  required: ["title", "fitReason", "requiredSkills", "educationOptions", "timeline", "challenges", "actionSteps", "marketReality", "realityCheck", "salaryRange", "demandScore", "growthScore"]
};

export const generateCareerAdvice = async (
  textInput: string,
  files: FileData[]
): Promise<CareerAdviceResponse> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });
  // Switched to Gemini 3 Pro for superior reasoning capabilities
  const modelName = "gemini-3-pro-preview"; 

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
    console.log("Step 1: Analyzing Profile with Gemini 3 Pro...");
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
      - Do NOT use placeholder values (e.g., 0, "TBD"). Estimate best available data.
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
      reflection: analysisResult.reflection,
      practicalPathway,
      growthPathway,
      closingMessage: "Your personalized career roadmap is ready. Remember, these are starting points—your journey is yours to define."
    };

  } catch (error) {
    console.error("Step 2 Failed:", error);
    throw new Error("Failed to generate detailed pathways. Please try again.");
  }
};

// --- AGENTIC CHAT ---

export const getChatSession = (): GenAIChatSession => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }
  const ai = new GoogleGenAI({ apiKey });
  
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `You are CareerSage's Agentic Assistant. 
      - Help the user by researching specific questions about scholarships, job markets, or education.
      - You have access to Google Search. USE IT proactively when asked for facts, dates, or prices.
      - Be concise, warm, and helpful.
      - Do NOT make up URLs. Only provide links found via the search tool.`,
      tools: [{ googleSearch: {} }] // Agentic Capability
    }
  });
};
