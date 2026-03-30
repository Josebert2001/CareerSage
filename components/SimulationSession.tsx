
import React, { useState, useEffect, useRef } from 'react';
import { Chat, GenerateContentResponse } from '@google/genai';
import { createSimulationSession, generateSimulationImage, editSimulationImage } from '../services/geminiService';
import { ChatMessage } from '../types';
import { User, Gamepad2, AlertCircle, XCircle, Play, ChevronRight, Briefcase, Bot, Image as ImageIcon, Wand2, Loader2, RotateCcw } from 'lucide-react';
import ConversationalInput from './ConversationalInput';

interface SimulationSessionProps {
  initialRole?: string;
  initialContext?: string;
  onExit: () => void;
}

const SimulationSession: React.FC<SimulationSessionProps> = ({ initialRole, initialContext, onExit }) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const lastImageRef = useRef<string | null>(null); 
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [needsSetup, setNeedsSetup] = useState(!initialRole);
  const [setupData, setSetupData] = useState({ role: initialRole || '', name: 'Student' });

  useEffect(() => {
    if (!needsSetup && initialRole) {
      initSession(initialRole, initialContext || `User: ${setupData.name}`);
    }
  }, [initialRole, needsSetup]);

  const processResponse = async (result: GenerateContentResponse, currentChat: Chat) => {
    let loopResult = result;

    while (true) {
        const parts = loopResult.candidates?.[0]?.content?.parts || [];
        let textContent = '';
        for (const part of parts) {
            if (part.text) textContent += part.text;
        }

        if (textContent) {
            setMessages(prev => [...prev, {
                id: 'msg-' + Date.now() + Math.random(),
                role: 'model',
                text: textContent
            }]);
        } else if (loopResult.functionCalls && loopResult.functionCalls.length > 0) {
            // If there's no text but there is a function call, show a placeholder
            setMessages(prev => [...prev, {
                id: 'msg-thinking-' + Date.now(),
                role: 'model',
                text: "The situation is developing...",
                isTyping: true
            }]);
        }

        if (loopResult.functionCalls && loopResult.functionCalls.length > 0) {
            const functionResponseParts: any[] = [];

            for (const call of loopResult.functionCalls) {
                 const loadingId = 'loading-' + Date.now();
                 const loadingText = call.name === 'generate_image' ? 'Visualizing scene...' : 'Updating view...';
                 
                 setMessages(prev => [...prev, { 
                    id: loadingId, 
                    role: 'model', 
                    text: '', 
                    isTyping: true, 
                    toolUse: loadingText 
                 }]);

                 let toolResultText = "";
                 
                 try {
                    if (call.name === 'generate_image') {
                        const prompt = (call.args as any)?.['prompt'] as string;
                        if (!prompt) {
                            toolResultText = "Error: Missing prompt.";
                        } else {
                            const imageData = await generateSimulationImage(prompt);
                            lastImageRef.current = imageData;
                            
                            setMessages(prev => prev.filter(m => m.id !== loadingId && m.id !== 'msg-thinking-' + Date.now()).concat({
                                id: 'img-' + Date.now(),
                                role: 'model',
                                text: textContent ? "" : "You see the following scene:",
                                image: imageData
                            }));
                            toolResultText = "Image generated successfully.";
                        }
                    } 
                    else if (call.name === 'edit_image') {
                        const instruction = (call.args as any)?.['instruction'] as string;
                        if (!instruction) {
                            toolResultText = "Error: Missing instruction.";
                        } else if (!lastImageRef.current) {
                             toolResultText = "Error: No context image available.";
                        } else {
                             const imageData = await editSimulationImage(lastImageRef.current, instruction);
                             lastImageRef.current = imageData;
                             
                             setMessages(prev => prev.filter(m => m.id !== loadingId).concat({
                                id: 'img-edit-' + Date.now(),
                                role: 'model',
                                text: `Visualization updated: ${instruction}`,
                                image: imageData
                            }));
                            toolResultText = "Image edited successfully.";
                        }
                    } else {
                         toolResultText = "Error: Tool not found.";
                    }
                 } catch (e) {
                     toolResultText = "Error: Tool failure.";
                     setMessages(prev => prev.filter(m => m.id !== loadingId));
                 }

                 functionResponseParts.push({
                    functionResponse: {
                        id: call.id, // CRITICAL: ID required for Gemini 3
                        name: call.name,
                        response: { result: toolResultText }
                    }
                });
            }

            loopResult = await currentChat.sendMessage({ message: functionResponseParts });
        } else {
            break;
        }
    }
  };

  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  const initSession = async (role: string, context: string) => {
    try {
      const session = createSimulationSession(role, context);
      setChat(session);
      setApiKeyMissing(false);
      setIsLoading(true);
      const response = await session.sendMessage({ message: "Start simulation. Provide a brief intro and generate the starting workspace image." });
      await processResponse(response, session);
      setIsLoading(false);
    } catch (e: any) {
      if (e.message === "API_KEY_MISSING") {
        setApiKeyMissing(true);
      } else {
        setMessages([{
          id: 'error-init',
          role: 'model',
          text: "Simulator offline. Reconnect required."
        }]);
      }
      setIsLoading(false);
    }
  };

  const handleConnectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      // After selecting, we try to re-init if we have the data
      if (!needsSetup && setupData.role) {
        initSession(setupData.role, `User: ${setupData.name}`);
      }
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (setupData.role.trim()) {
        setNeedsSetup(false);
        initSession(setupData.role, `User: ${setupData.name}. Roleplay session.`);
    }
  };

  const handleRestart = () => {
    setMessages([]);
    lastImageRef.current = null;
    initSession(setupData.role, `User: ${setupData.name}`);
  };

  const handleSend = async () => {
    if (!input.trim() || !chat || isLoading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    try {
      const result = await chat.sendMessage({ message: userMsg.text });
      await processResponse(result, chat);
    } catch (err) {
      setMessages(prev => [...prev, { id: 'err-' + Date.now(), role: 'model', text: "The simulation encountered a rift. Try another action." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (needsSetup) {
    return (
        <div className="flex flex-col h-[650px] max-w-2xl mx-auto glass-card rounded-[2.5rem] shadow-2xl overflow-hidden animate-fadeIn relative border-white/40">
             <button onClick={onExit} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 z-10 transition-colors">
                <XCircle className="w-10 h-10" />
            </button>
            <div className="flex flex-col items-center justify-center h-full text-center space-y-10 p-10 relative overflow-hidden">
                <div className="relative z-10 bg-white p-6 rounded-full shadow-xl border border-indigo-50 mb-2">
                    <Gamepad2 className="w-16 h-16 text-indigo-600" />
                </div>
                <div className="space-y-4 relative z-10">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">Before you commit to a path — <br/>live a day in it first.</h2>
                  <p className="text-slate-500 text-lg max-w-md mx-auto leading-relaxed">Most people find out they hate a career after 3 years in it. You get to find out in 10 minutes.</p>
                </div>
                
                <form onSubmit={handleSetupSubmit} className="w-full max-w-sm space-y-4 relative z-10">
                    <div className="space-y-2 text-left">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">What should I call you?</label>
                      <input type="text" required value={setupData.name} onChange={(e) => setSetupData({...setupData, name: e.target.value})} className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:border-indigo-500 outline-none transition-all font-medium" placeholder="Your name..." />
                    </div>
                    <div className="space-y-2 text-left">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Which role do you want to try?</label>
                      <input type="text" required value={setupData.role} onChange={(e) => setSetupData({...setupData, role: e.target.value})} className="w-full border-2 border-slate-100 rounded-2xl p-4 focus:border-indigo-500 outline-none transition-all font-medium" placeholder="e.g. Software Engineer, Nurse, Architect..." />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all transform hover:-translate-y-1 active:scale-95">Step into this life</button>
                </form>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto glass-card rounded-3xl shadow-2xl overflow-hidden animate-fadeIn relative">
        {apiKeyMissing && (
            <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6 text-center">
                <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm animate-scaleIn">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Gamepad2 className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Gemini API Key Required</h3>
                    <p className="text-slate-600 mb-8 text-sm leading-relaxed">
                        To run the career simulation, you need to connect your Gemini API key.
                    </p>
                    <button 
                        onClick={handleConnectKey}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                    >
                        Connect Gemini API
                    </button>
                </div>
            </div>
        )}
        <div className="p-4 bg-white/40 border-b flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Gamepad2 className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-slate-800">{initialRole || setupData.role} Simulator</h2>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={handleRestart} className="p-2 text-slate-400 hover:text-indigo-600"><RotateCcw className="w-5 h-5" /></button>
                <button onClick={onExit} className="text-xs font-bold text-slate-500 hover:text-red-600">EXIT</button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg) => (
            <div key={msg.id} className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-white border'}`}>
                    {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-indigo-600" />}
                </div>
                <div className={`max-w-[85%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {msg.image && (
                        <div className="mb-2 p-2 bg-white rounded-2xl shadow-md border max-w-md">
                            <img src={`data:image/png;base64,${msg.image}`} className="w-full rounded-xl" />
                        </div>
                    )}
                    {msg.text && (
                        <div className={`p-5 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border'}`}>
                            {msg.text}
                        </div>
                    )}
                </div>
            </div>
            ))}
            <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white/60 border-t">
            <ConversationalInput value={input} onChange={setInput} onSubmit={handleSend} placeholder="What do you do next?" />
        </div>
    </div>
  );
};

export default SimulationSession;
