
declare global {
  interface Window {
    aistudio?: {
      openSelectKey?(): Promise<void>;
      hasSelectedApiKey?(): Promise<boolean>;
    };
  }
}

export interface Source {
  title: string;
  uri: string;
}

export interface Pathway {
  title: string;
  fitReason: string;
  requiredSkills: {
    technical: string[];
    soft: string[];
  };
  educationOptions: string[];
  timeline: string;
  challenges: string[];
  actionSteps: string[];
  // New Data Fields for Charts
  marketReality: string;
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  demandScore: number; // 0 to 100
  growthScore: number; // 0 to 100
  realityCheck?: string;
}

export interface CareerAdviceResponse {
  studentProfile: {
    summary: string;
    keyStrengths: string[];
  };
  contextAnalysis: string;
  reflection: string;
  practicalPathway: Pathway;
  growthPathway: Pathway;
  closingMessage: string;
  sources?: Source[];
}

export interface FileData {
  name: string;
  mimeType: string;
  data: string; // Base64
}

export interface FutureVision {
  imageData: string; // Base64
  caption: string;
}

export enum AppState {
  WELCOME = 'WELCOME',
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  SIMULATION = 'SIMULATION',
  ERROR = 'ERROR'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: Source[];
  isTyping?: boolean;
  toolUse?: string; // e.g., "Searching Google..."
  image?: string; // Base64 image data for simulation
}

export interface UserProfile {
  name: string;
  situation: string;
  interests: string[];
  constraints: string[];
  dreams: string;
  concerns: string;
}

// --- NEW HISTORY TYPES ---

export type SessionType = 'advisor' | 'chat';

export interface SavedSession {
  id: string;
  type: SessionType;
  timestamp: number;
  title: string;
  preview: string;
  data: CareerAdviceResponse | ChatMessage[];
}
