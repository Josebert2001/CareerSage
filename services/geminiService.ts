import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";
import { CareerAdviceResponse, FileData } from "../types";

const apiKey = process.env.API_KEY;

// Define the response schema strictly to match our UI needs
const pathwaySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A catchy but descriptive title for this career path" },
    fitReason: { type: Type.STRING, description: "Why this fits the student's profile and goals" },
    requiredSkills: {
      type: Type.OBJECT,
      properties: {
        technical: { type: Type.ARRAY, items: { type: Type.STRING } },
        soft: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    educationOptions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of formal and informal learning options with cost context" },
    timeline: { type: Type.STRING, description: "Realistic timeline breakdown (e.g., 0-6 months: X, 6-12 months: Y)" },
    challenges: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Potential risks and obstacles" },
    actionSteps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 immediate concrete steps for this week" },
    marketReality: { type: Type.STRING, description: "Realistic outlook on income, job availability, and demand in their region" }
  },
  required: ["title", "fitReason", "requiredSkills", "educationOptions", "timeline", "challenges", "actionSteps", "marketReality"]
};

const adviceSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    studentProfile: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING, description: "A brief summary of who the student is based on input" },
        keyStrengths: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    contextAnalysis: { type: Type.STRING, description: "Analysis of their educational background, resources, and local context" },
    practicalPathway: pathwaySchema,
    growthPathway: pathwaySchema,
    closingMessage: { type: Type.STRING, description: "Encouraging closing remark reminding them the choice is theirs" }
  },
  required: ["studentProfile", "contextAnalysis", "practicalPathway", "growthPathway", "closingMessage"]
};

export const generateCareerAdvice = async (
  textInput: string,
  files: FileData[]
): Promise<CareerAdviceResponse> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const parts: any[] = [];
  
  // Add files if they exist
  if (files && files.length > 0) {
    files.forEach(file => {
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data
        }
      });
    });
  }

  // Add text input
  parts.push({
    text: `Student Scenario: ${textInput}`
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Upgraded model for better reasoning
      contents: {
        role: "user",
        parts: parts
      },
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: adviceSchema,
        temperature: 0.7, // Slightly creative but grounded
      }
    });

    let responseText = response.text;
    if (!responseText) {
      throw new Error("No response received from AI.");
    }

    // Sanitize JSON output (remove Markdown code blocks if present)
    responseText = responseText.replace(/```json\n?|```/g, '').trim();

    return JSON.parse(responseText) as CareerAdviceResponse;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};