
import React, { useState, useEffect, useRef } from 'react';
import { ChatSession as GenAIChatSession, GenerateContentResponse } from '@google/genai';
import { getChatSession } from '../services/geminiService';
import { ChatMessage, Source } from '../types';
import { Send, User, Sparkles, ExternalLink, Loader2, RefreshCw } from 'lucide-react';

const ChatSession: React.FC = () => {
  const [chat, setChat] = useState<GenAIChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Chat Session
    try {
      const session = getChatSession();
      setChat(session);
      
      // Initial greeting
      setMessages([{
        id: 'init',
        role: 'model',
        text: "Hello! I'm your CareerSage assistant. I can help you research specific universities, find scholarships, or check current job market trends. What can I look up for you?"
      }]);
    } catch (e) {
      console.error("Failed to init chat", e);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !chat || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Add a temporary "Thinking..." message
      const thinkingMsgId = 'thinking-' + Date.now();
      setMessages(prev => [...prev, { id: thinkingMsgId, role: 'model', text: '', isTyping: true }]);

      const result = await chat.sendMessageStream(userMsg.text);
      
      let fullText = '';
      let sources: Source[] = [];

      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse; // Type assertion for safety
        if (c.text) {
          fullText += c.text;
        }
        
        // Extract sources from grounding metadata if present
        if (c.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          c.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
            if (chunk.web?.uri && chunk.web?.title) {
              sources.push({ title: chunk.web.title, uri: chunk.web.uri });
            }
          });
        }

        // Update the last message in real-time
        setMessages(prev => {
          const newHistory = [...prev];
          const lastIdx = newHistory.findIndex(m => m.id === thinkingMsgId);
          if (lastIdx !== -1) {
            newHistory[lastIdx] = {
              ...newHistory[lastIdx],
              text: fullText,
              isTyping: false, // Start showing text as soon as we have it
              sources: sources.length > 0 ? sources : undefined
            };
          }
          return newHistory;
        });
      }
      
      // Deduplicate sources
      sources = sources.filter((v, i, a) => a.findIndex(t => (t.uri === v.uri)) === i);
       
      // Final update to ensure everything is settled
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
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fadeIn">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-100 bg-emerald-50/50 flex items-center gap-3">
        <div className="bg-emerald-100 p-2 rounded-full">
          <Sparkles className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">CareerSage Research Agent</h3>
          <p className="text-xs text-slate-500">Powered by Gemini 3 Pro • Search Enabled</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-200' : 'bg-emerald-600'}`}>
              {msg.role === 'user' ? <User className="w-5 h-5 text-slate-500" /> : <Sparkles className="w-4 h-4 text-white" />}
            </div>
            
            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div 
                className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-slate-800 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                }`}
              >
                {msg.isTyping && !msg.text ? (
                  <div className="flex gap-1 h-5 items-center">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                )}
              </div>

              {/* Sources Display */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {msg.sources.map((src, i) => (
                    <a 
                      key={i} 
                      href={src.uri} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 hover:bg-blue-100 hover:border-blue-200 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="truncate max-w-[150px]">{src.title}</span>
                    </a>
                  ))}
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
            placeholder="Ask a follow-up question..."
            disabled={isLoading}
            className="w-full pl-5 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
        <div className="mt-2 text-center">
            <p className="text-[10px] text-slate-400">Gemini 3 Pro may produce inaccurate information.</p>
        </div>
      </div>
    </div>
  );
};

export default ChatSession;
