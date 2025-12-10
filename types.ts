
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

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: Source[];
  isTyping?: boolean;
}
