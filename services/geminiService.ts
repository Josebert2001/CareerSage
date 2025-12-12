
import { GoogleGenAI, Type, Schema, ChatSession as GenAIChatSession, FunctionDeclaration, Tool } from "@google/genai";
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
    analysisResult = JSON.parse(cleanJson(analysisResponse.text));
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

// --- VISION GENERATOR (IMAGE) ---

export const generateFutureVision = async (
  role: string, 
  userContext: string
): Promise<FutureVision> => {
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Generate a high-quality, photorealistic image of a young professional working as a ${role} in a modern African context (e.g. Lagos, Nairobi, or general urban setting).
    
    User Context for personalization: ${userContext}
    
    The image should be inspiring, warm, and professional. 
    Also, provide a short, 1-sentence motivational caption about their future success in this role.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview', // High quality image model
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      },
    });

    let imageData = "";
    let caption = `Your future as a ${role} looks bright.`;

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageData = part.inlineData.data;
      } else if (part.text) {
        caption = part.text;
      }
    }

    if (!imageData) throw new Error("No image generated");

    return { imageData, caption };
  } catch (e) {
    console.error("Image gen failed", e);
    throw e;
  }
};

// --- SIMULATION IMAGE GENERATION (FLASH 2.5) ---

export const generateSimulationImage = async (prompt: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });

  console.log("Generating simulation image with Gemini 2.5 Flash Image:", prompt);
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt }]
    }
  });

  let imageData = "";
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      imageData = part.inlineData.data;
      break;
    }
  }

  if (!imageData) throw new Error("Failed to generate image.");
  return imageData;
};

export const editSimulationImage = async (base64Image: string, instruction: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing.");
  const ai = new GoogleGenAI({ apiKey });

  console.log("Editing simulation image with Gemini 2.5 Flash Image:", instruction);

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
    if (part.inlineData) {
      imageData = part.inlineData.data;
      break;
    }
  }

  if (!imageData) throw new Error("Failed to edit image.");
  return imageData;
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

// --- SIMULATION ENGINE ---

export const createSimulationSession = (role: string, context: string): GenAIChatSession => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }
  const ai = new GoogleGenAI({ apiKey });

  // Define tools for image generation and editing
  const tools: Tool[] = [
    {
      functionDeclarations: [
        {
          name: "generate_image",
          description: "Generate an image based on a description. Use this when the user asks to see something, design something, or visualize a scene.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              prompt: { type: Type.STRING, description: "The detailed description of the image to generate." }
            },
            required: ["prompt"]
          }
        },
        {
          name: "edit_image",
          description: "Edit the previously generated image based on instructions. Use this when the user wants to change, modify, apply a filter, or add/remove elements from the last image shown.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              instruction: { type: Type.STRING, description: "The instruction for editing the image (e.g. 'Add a retro filter', 'Make it blue')." }
            },
            required: ["instruction"]
          }
        }
      ]
    }
  ];
  
  return ai.chats.create({
    model: 'gemini-2.5-flash', // Flash for lower latency in roleplay and orchestration
    config: {
      tools: tools,
      systemInstruction: `
        You are an interactive Career Simulator Engine.
        Your Goal: Immerse the user in a "Day in the Life" scenario for the role of: ${role}.
        
        Rules:
        1. Start by setting a realistic, challenging scene appropriate for an entry-level ${role}.
        2. Keep the scene culturally relevant to the user's context: ${context}.
        3. Do NOT just ask "What do you do?". Give them specific details/data/visuals in text.
        4. IMAGE GENERATION: If the scenario involves visual elements (e.g., "Design a logo", "Look at this broken circuit", "View the office layout") OR if the user explicitly asks to generate/create an image, use the \`generate_image\` tool.
        5. IMAGE EDITING: If the user wants to change an image you just showed them (e.g., "Make it darker", "Add a retro filter", "Remove the person"), use the \`edit_image\` tool.
        6. Wait for the user's response.
        7. React to their choice. If good, advance the plot. If bad, show the consequence (gently).
        8. Keep turns short (max 3 sentences).
        9. After 5 turns, or if the user solves it, conclude with a "Performance Review" and ask if they liked the job.
      `
    }
  });
};
