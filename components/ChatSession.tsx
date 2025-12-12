
import React, { useState, useEffect, useRef } from 'react';
import { ChatSession as GenAIChatSession, GenerateContentResponse } from '@google/genai';
import { getChatSession } from '../services/geminiService';
import { ChatMessage, Source } from '../types';
import { saveSession } from '../services/storage';
import { Send, User, Sparkles, ExternalLink, Loader2, Search, BrainCircuit, Save } from 'lucide-react';

interface ChatSessionProps {
  initialMessages?: ChatMessage[];
}

const ChatSession: React.FC<ChatSessionProps> = ({ initialMessages }) => {
  const [chat, setChat] = useState<GenAIChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  
  // State for tracking session persistence
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const sessionIdRef = useRef<string | undefined>(undefined);
  const hasInteractedRef = useRef(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]); // Ref to access latest state in cleanup

  // Sync refs with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    try {
      const session = getChatSession();
      setChat(session);
      
      if (initialMessages && initialMessages.length > 0) {
        setMessages(initialMessages);
        // We don't have the original ID when restoring from simple props in this architecture, 
        // so we start 'fresh'. First save will create a new entry (fork).
      } else {
        setMessages([{
          id: 'init',
          role: 'model',
          text: "Hello! I'm your Agentic Career Researcher.\n\nI can verify facts, check job market trends, or find scholarship deadlines using real-time Google Search.\n\nTry asking: 'What is the starting salary for a Data Analyst in Lagos right now?'"
        }]);
      }
    } catch (e) {
      console.error("Failed to init chat", e);
    }
  }, [initialMessages]);

  // Robust Autosave: Handles Tab Close, Refresh, and Component Unmount
  useEffect(() => {
    let savedOnUnload = false;

    const save = () => {
      if (savedOnUnload) return;
      
      const msgs = messagesRef.current;
      const currentId = sessionIdRef.current;
      
      // Only auto-save if user has interacted and there is content to save
      if (msgs.length > 1 && hasInteractedRef.current) {
        saveSession('chat', msgs, undefined, currentId);
      }
      
      savedOnUnload = true;
    };

    const onBeforeUnload = () => {
      save();
    };

    // Listen for browser close/refresh
    window.addEventListener('beforeunload', onBeforeUnload);
    
    // Listen for component unmount (in-app navigation)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      save();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleManualSave = () => {
    if (messages.length > 1) {
      const saved = saveSession('chat', messages, undefined, sessionId);
      setSessionId(saved.id); // Update session ID so future autosaves update this entry
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !chat || isLoading) return;

    // Mark as interacted so autosave will trigger
    hasInteractedRef.current = true;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const thinkingMsgId = 'thinking-' + Date.now();
      // Agentic "Thinking" State
      setMessages(prev => [...prev, { id: thinkingMsgId, role: 'model', text: '', isTyping: true, toolUse: 'Processing request...' }]);

      // Fixed: passed input as { message: ... }
      const result = await chat.sendMessageStream({ message: userMsg.text });
      
      let fullText = '';
      let sources: Source[] = [];
      let toolActivity = 'Generating response...';

      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          fullText += c.text;
        }
        
        // Visualize Grounding as "Agent Action"
        if (c.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          toolActivity = 'Searching web sources...';
          c.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
            if (chunk.web?.uri && chunk.web?.title) {
              sources.push({ title: chunk.web.title, uri: chunk.web.uri });
            }
          });
        }

        setMessages(prev => {
          const newHistory = [...prev];
          const lastIdx = newHistory.findIndex(m => m.id === thinkingMsgId);
          if (lastIdx !== -1) {
            newHistory[lastIdx] = {
              ...newHistory[lastIdx],
              text: fullText,
              isTyping: false,
              sources: sources.length > 0 ? sources : undefined,
              toolUse: sources.length > 0 ? 'Verified with Google Search' : undefined
            };
          }
          return newHistory;
        });
      }
      
      // Cleanup dupes
      sources = sources.filter((v, i, a) => a.findIndex(t => (t.uri === v.uri)) === i);
       
      setMessages(prev => {
          const newHistory = [...prev];
          const lastIdx = newHistory.findIndex(m => m.id === thinkingMsgId);
          if (lastIdx !== -1) {
             newHistory[lastIdx] = { ...newHistory[lastIdx], isTyping: false, sources: sources.length > 0 ? sources : undefined };
          }
          return newHistory;
      });

    } catch (err) {
      console.error("Chat error", err);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: "I'm having trouble connecting right now. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fadeIn relative">
      {/* Agent Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-lg">
            <BrainCircuit className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold">CareerSage Agent</h3>
            <p className="text-xs text-emerald-200">Autonomous Research Mode</p>
          </div>
        </div>
        <button 
            onClick={handleManualSave}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${justSaved ? 'bg-emerald-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
        >
            {justSaved ? <span className="flex items-center gap-1">Saved!</span> : <><Save className="w-4 h-4" /> Save Chat</>}
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${msg.role === 'user' ? 'bg-white' : 'bg-emerald-600'}`}>
              {msg.role === 'user' ? <User className="w-5 h-5 text-slate-700" /> : <Sparkles className="w-5 h-5 text-white" />}
            </div>
            
            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              
              {/* Tool Usage Indicator */}
              {msg.role === 'model' && msg.toolUse && (
                  <div className="flex items-center gap-2 mb-2 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs text-slate-500 font-medium shadow-sm w-fit animate-fadeIn">
                      <Search className="w-3 h-3 text-emerald-500" />
                      {msg.toolUse}
                  </div>
              )}

              <div 
                className={`px-6 py-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-slate-800 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                }`}
              >
                {msg.isTyping && !msg.text ? (
                  <div className="flex gap-1 h-6 items-center">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                )}
              </div>

              {/* Sources Display */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 bg-white p-3 rounded-xl border border-blue-100 shadow-sm w-full">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Verified Sources</p>
                   <div className="flex flex-wrap gap-2">
                    {msg.sources.map((src, i) => (
                        <a 
                        key={i} 
                        href={src.uri} 
                        target="_blank" 
                        rel="noreferrer"
                        className="block w-full text-xs text-blue-600 hover:underline truncate"
                        >
                        {src.title}
                        </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me to find scholarships, salaries, or courses..."
            disabled={isLoading}
            className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin p-1" /> : <Send className="w-5 h-5 m-0.5" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatSession;
