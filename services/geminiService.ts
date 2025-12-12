
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

export const getChatSession = (): Chat => {
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

export const createSimulationSession = (role: string, context: string): Chat => {
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
          description: "Generate a realistic image of the current scene, object, or person. Use this to establish the setting or show the result of an action.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              prompt: { type: Type.STRING, description: "Detailed visual description of the scene." }
            },
            required: ["prompt"]
          }
        },
        {
          name: "edit_image",
          description: "Edit the PREVIOUSLY shown image based on the user's action. Use this to show changes, fixes, or worsening conditions.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              instruction: { type: Type.STRING, description: "Instruction for editing the image (e.g. 'Make the screen red with error', 'Fix the broken pipe')." }
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
        You are the "Career Dungeon Master". Run a high-stakes, interactive job simulation for a ${role}.
        User Context: ${context}.

        OBJECTIVE:
        Simulate a "Day in the Life" that tests the user's decision-making, ethics, and competence.

        NARRATIVE FLOW:
        1. **The Setup**: Begin immediately. \`generate_image\` of the workspace (POV). Describe the setting and the first task.
        2. **The Complication**: Introduce a complex problem (e.g. equipment failure, difficult client, safety hazard, ethical dilemma).
        3. **Decision Points (CRITICAL)**: 
           - Present clear choices or open-ended problems.
           - *Example*: "The server room is overheating (Image). Do you (A) Shut down the core system (safe but costly) or (B) Try to patch the cooling live (risky)?"
        4. **Visual Consequences**: 
           - **If the user succeeds**: Use \`edit_image\` or \`generate_image\` to show the fixed state or reward.
           - **If the user fails**: Use \`generate_image\` to show the disaster (e.g., smoke, blue screen of death, angry boss face).
        5. **Evaluation**: After ~6 interactions, end with a "Performance Review": Score /100 and Feedback.

        BEHAVIOR RULES:
        - **Visual First**: Use tools frequently. The user should *see* the result of their actions.
        - **Editing**: If the user says "fix the logo" or "clean the desk", use \`edit_image\`.
        - **Adaptability**: If the user does something unexpected, roll with it and generate consequences.
        - **Tone**: Professional, immersive, and sometimes urgent.
        - **Context**: Ensure scenarios fit the African/Nigerian context (e.g. dealing with power/internet constraints).
      `
    }
  });
};
