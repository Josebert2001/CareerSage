
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
                        const prompt = call.args['prompt'] as string;
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
                    else if (call.name === 'edit_image') {
                        const instruction = call.args['instruction'] as string;
                        if (!lastImageRef.current) {
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

  const initSession = async (role: string, context: string) => {
    try {
      const session = createSimulationSession(role, context);
      setChat(session);
      setIsLoading(true);
      const response = await session.sendMessage({ message: "Start simulation. Provide a brief intro and generate the starting workspace image." });
      await processResponse(response, session);
      setIsLoading(false);
    } catch (e) {
      setMessages([{
        id: 'error-init',
        role: 'model',
        text: "Simulator offline. Reconnect required."
      }]);
      setIsLoading(false);
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
        <div className="flex flex-col h-[600px] max-w-2xl mx-auto glass-card rounded-2xl shadow-xl overflow-hidden animate-fadeIn relative">
             <button onClick={onExit} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10">
                <XCircle className="w-8 h-8" />
            </button>
            <div className="flex flex-col items-center justify-center h-full text-center space-y-8 p-8 relative overflow-hidden">
                <div className="relative z-10 bg-white p-5 rounded-full shadow-lg border border-indigo-100 mb-4">
                    <Gamepad2 className="w-14 h-14 text-indigo-600" />
                </div>
                <h2 className="text-4xl font-bold text-slate-800">Career Simulator</h2>
                <form onSubmit={handleSetupSubmit} className="w-full max-w-sm space-y-5 relative z-10">
                    <input type="text" required value={setupData.name} onChange={(e) => setSetupData({...setupData, name: e.target.value})} className="w-full border rounded-xl p-3.5" placeholder="Name" />
                    <input type="text" required value={setupData.role} onChange={(e) => setSetupData({...setupData, role: e.target.value})} className="w-full border rounded-xl p-3.5" placeholder="Job Title" />
                    <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold">Launch Sim</button>
                </form>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto glass-card rounded-3xl shadow-2xl overflow-hidden animate-fadeIn relative">
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
