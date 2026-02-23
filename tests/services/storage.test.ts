import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Import after mock is set up
import { getHistory, saveSession, deleteSession } from '../../services/storage';
import { CareerAdviceResponse, ChatMessage } from '../../types';

const STORAGE_KEY = 'careersage_history_v1';

describe('storage service', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('getHistory', () => {
    it('returns empty array when nothing stored', () => {
      expect(getHistory()).toEqual([]);
    });

    it('returns parsed sessions from localStorage', () => {
      const sessions = [{ id: '1', type: 'advisor', timestamp: 1000, title: 'Test', preview: '', data: {} }];
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(sessions));
      const result = getHistory();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('returns empty array on corrupt JSON', () => {
      localStorageMock.getItem.mockReturnValueOnce('not-json{{{');
      const result = getHistory();
      expect(result).toEqual([]);
    });
  });

  describe('saveSession', () => {
    const mockAdvisorData: CareerAdviceResponse = {
      studentProfile: { summary: 'A computer science student. Very passionate.', keyStrengths: ['coding'] },
      contextAnalysis: 'test',
      reflection: 'test',
      practicalPathway: {
        title: 'Frontend Developer',
        fitReason: 'good fit',
        requiredSkills: { technical: ['React'], soft: ['communication'] },
        educationOptions: ['BSc'],
        timeline: '6 months',
        challenges: ['competition'],
        actionSteps: ['learn React'],
        marketReality: 'in demand',
        realityCheck: 'competitive',
        salaryRange: { min: 50000, max: 100000, currency: 'USD' },
        demandScore: 80,
        growthScore: 70,
      },
      growthPathway: {
        title: 'ML Engineer',
        fitReason: 'aspirational',
        requiredSkills: { technical: ['Python'], soft: ['research'] },
        educationOptions: ['MSc'],
        timeline: '2 years',
        challenges: ['math'],
        actionSteps: ['study ML'],
        marketReality: 'growing',
        realityCheck: 'requires math',
        salaryRange: { min: 80000, max: 150000, currency: 'USD' },
        demandScore: 90,
        growthScore: 95,
      },
      reasoning: 'good fit',
    } as any;

    it('saves a new advisor session', () => {
      const session = saveSession('advisor', mockAdvisorData);
      expect(session.type).toBe('advisor');
      expect(session.title).toBe('A computer science student');
      expect(session.preview).toContain('Frontend Developer');
      expect(session.preview).toContain('ML Engineer');
    });

    it('saves a new chat session', () => {
      const chatData: ChatMessage[] = [
        { id: '1', role: 'user', text: 'What career should I pursue in tech?' },
        { id: '2', role: 'model', text: 'Based on your interests...' },
      ];
      const session = saveSession('chat', chatData);
      expect(session.type).toBe('chat');
      expect(session.preview).toContain('2 messages');
    });

    it('limits history to 20 items', () => {
      for (let i = 0; i < 25; i++) {
        saveSession('chat', [{ id: String(i), role: 'user', text: `Message ${i}` }] as ChatMessage[]);
      }
      const history = getHistory();
      expect(history.length).toBeLessThanOrEqual(20);
    });

    it('updates existing session when existingId provided', () => {
      const session1 = saveSession('chat', [{ id: '1', role: 'user', text: 'First message' }] as ChatMessage[]);
      const updatedData: ChatMessage[] = [
        { id: '1', role: 'user', text: 'First message' },
        { id: '2', role: 'model', text: 'Reply' },
      ];
      const session2 = saveSession('chat', updatedData, undefined, session1.id);
      expect(session2.id).toBe(session1.id);
      expect(session2.preview).toContain('2 messages');
    });
  });

  describe('deleteSession', () => {
    it('removes a session by ID', () => {
      const session = saveSession('chat', [{ id: '1', role: 'user', text: 'Test message for deletion' }] as ChatMessage[]);
      expect(getHistory()).toHaveLength(1);
      deleteSession(session.id);
      expect(getHistory()).toHaveLength(0);
    });

    it('handles deleting non-existent ID gracefully', () => {
      saveSession('chat', [{ id: '1', role: 'user', text: 'Keep this message intact' }] as ChatMessage[]);
      deleteSession('non-existent-id');
      expect(getHistory()).toHaveLength(1);
    });
  });
});
