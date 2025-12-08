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
  marketReality: string;
}

export interface CareerAdviceResponse {
  studentProfile: {
    summary: string;
    keyStrengths: string[];
  };
  contextAnalysis: string;
  practicalPathway: Pathway;
  growthPathway: Pathway;
  closingMessage: string;
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
