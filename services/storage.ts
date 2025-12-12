
import { SavedSession, SessionType, CareerAdviceResponse, ChatMessage } from "../types";

const STORAGE_KEY = 'careersage_history_v1';

export const getHistory = (): SavedSession[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load history", e);
    return [];
  }
};

export const saveSession = (
  type: SessionType, 
  data: CareerAdviceResponse | ChatMessage[], 
  customTitle?: string
): SavedSession => {
  const history = getHistory();
  const timestamp = Date.now();
  let title = customTitle || "Untitled Session";
  let preview = "";

  if (type === 'advisor') {
    const advData = data as CareerAdviceResponse;
    title = advData.studentProfile.summary.split('.')[0] || "Career Plan";
    preview = `Pathways: ${advData.practicalPathway.title} & ${advData.growthPathway.title}`;
  } else {
    const chatData = data as ChatMessage[];
    if (chatData.length > 0) {
        // Find first user message for title
        const firstUserMsg = chatData.find(m => m.role === 'user');
        title = firstUserMsg ? firstUserMsg.text.substring(0, 30) + "..." : "Quick Chat";
        preview = `${chatData.length} messages`;
    }
  }

  const newSession: SavedSession = {
    id: timestamp.toString(),
    type,
    timestamp,
    title,
    preview,
    data
  };

  // Add to top, limit to 20 items
  const updatedHistory = [newSession, ...history].slice(0, 20);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  
  return newSession;
};

export const deleteSession = (id: string) => {
  const history = getHistory();
  const updated = history.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const clearHistory = () => {
  localStorage.removeItem(STORAGE_KEY);
};
