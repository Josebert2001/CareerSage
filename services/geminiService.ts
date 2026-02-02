
import { GoogleGenAI, Type, Schema, Chat, FunctionDeclaration, Tool } from "@google/genai";
import { ANALYSIS_PROMPT } from "../constants";
import { CareerAdviceResponse, FileData, Pathway, FutureVision } from "../types";

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

// Helper to remove markdown code blocks if the model includes them
const cleanJson = (text: string): string => {
  return text.replace(/```json\n?|```/g, '').trim();
};

export const generateCareerAdvice = async (
  textInput: string,
  files: FileData[]
): Promise<CareerAdviceResponse> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = "gemini-3-pro-preview"; 

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
      model: modelName,
      contents: [{ role: "user", parts: analysisParts }],
      config: {
        systemInstruction: ANALYSIS_PROMPT,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.3,
      }
    });

    if (!analysisResponse.text) throw new Error("Empty response from AI");
    analysisResult = JSON.parse(cleanJson(analysisResponse.text));
  } catch (error) {
    console.error("Step 1 Failed:", error);
    throw new Error("Failed to analyze profile. Please try again.");
  }

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
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: pathwaySchema,
        temperature: 0.4,
      }
    });
    
    if (!response.text) throw new Error("Empty pathway response");
    return JSON.parse(cleanJson(response.text)) as Pathway;
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

export const generateFutureVision = async (
  role: string, 
  userContext: string
): Promise<FutureVision> => {
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Generate a photorealistic image of a professional working as a ${role} in a modern African urban context.
    Context: ${userContext}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } },
    });

    let imageData = "";
    let caption = `Your future as a ${role} looks bright.`;

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) imageData = part.inlineData.data;
      else if (part.text) caption = part.text;
    }
    if (!imageData) throw new Error("No image generated");
    return { imageData, caption };
  } catch (e) {
    throw e;
  }
};

export const generateSimulationImage = async (prompt: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] }
  });
  let imageData = "";
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) { imageData = part.inlineData.data; break; }
  }
  if (!imageData) throw new Error("Failed to generate image.");
  return imageData;
};

export const editSimulationImage = async (base64Image: string, instruction: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/png', data: base64Image } },
        { text: instruction }
      ]
    }
  });
  let imageData = "";
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) { imageData = part.inlineData.data; break; }
  }
  if (!imageData) throw new Error("Failed to edit image.");
  return imageData;
};

export const getChatSession = (): Chat => {
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `You are CareerSage's Agentic Assistant. Use Google Search proactively.`,
      tools: [{ googleSearch: {} }]
    }
  });
};

export const createSimulationSession = (role: string, context: string): Chat => {
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });

  const tools: Tool[] = [{
    functionDeclarations: [
      {
        name: "generate_image",
        description: "Generate an image of the current scene.",
        parameters: {
          type: Type.OBJECT,
          properties: { prompt: { type: Type.STRING } },
          required: ["prompt"]
        }
      },
      {
        name: "edit_image",
        description: "Edit the existing image.",
        parameters: {
          type: Type.OBJECT,
          properties: { instruction: { type: Type.STRING } },
          required: ["instruction"]
        }
      }
    ]
  }];
  
  return ai.chats.create({
    model: 'gemini-3-pro-preview', // Switched to Pro for better function handling
    config: {
      tools: tools,
      systemInstruction: `
        You are the "Career Dungeon Master". Run an interactive job simulation for a ${role}.
        User Context: ${context}.
        RULES:
        1. Always start with a scene description and call generate_image.
        2. Present high-stakes choices.
        3. Use edit_image to show results of user actions.
      `
    }
  });
};
