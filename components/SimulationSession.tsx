
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
  
  // Use Ref for image persistence to avoid closure staleness in async loops
  const lastImageRef = useRef<string | null>(null); 
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Setup State for manual entry
  const [needsSetup, setNeedsSetup] = useState(!initialRole);
  const [setupData, setSetupData] = useState({ role: initialRole || '', name: 'Student' });

  useEffect(() => {
    // If we have data immediately, start. Otherwise wait for setup form.
    if (!needsSetup && initialRole) {
      initSession(initialRole, initialContext || `User: ${setupData.name}`);
    }
  }, [initialRole, needsSetup]);

  // --- CORE LOGIC: PROCESS RESPONSES ---
  // This handles the loop of Text -> Function Call -> Function Result -> Text
  const processResponse = async (result: GenerateContentResponse, currentChat: Chat) => {
    let loopResult = result;

    while (true) {
        // 1. Extract and display TEXT parts immediately
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
        }

        // 2. Check for FUNCTION CALLS
        if (loopResult.functionCalls && loopResult.functionCalls.length > 0) {
            const functionResponseParts: any[] = [];

            for (const call of loopResult.functionCalls) {
                 // Ephemeral Loading Message for Tool Action
                 const loadingId = 'loading-' + Date.now();
                 const loadingText = call.name === 'generate_image' ? 'Generating visualization...' : 'Updating visualization...';
                 
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
                        
                        // Replace loading with Image Message
                        setMessages(prev => prev.filter(m => m.id !== loadingId).concat({
                            id: 'img-' + Date.now(),
                            role: 'model',
                            text: `Generated: ${prompt}`,
                            image: imageData
                        }));
                        toolResultText = "Image generated successfully.";
                    } 
                    else if (call.name === 'edit_image') {
                        const instruction = call.args['instruction'] as string;
                        if (!lastImageRef.current) {
                             toolResultText = "Error: No previous image found to edit.";
                             setMessages(prev => prev.filter(m => m.id !== loadingId));
                        } else {
                             const imageData = await editSimulationImage(lastImageRef.current, instruction);
                             lastImageRef.current = imageData;
                             
                             setMessages(prev => prev.filter(m => m.id !== loadingId).concat({
                                id: 'img-edit-' + Date.now(),
                                role: 'model',
                                text: `Edited: ${instruction}`,
                                image: imageData
                            }));
                            toolResultText = "Image edited successfully.";
                        }
                    } else {
                         toolResultText = "Error: Unknown function.";
                         setMessages(prev => prev.filter(m => m.id !== loadingId));
                    }
                 } catch (e) {
                     console.error("Tool execution error", e);
                     toolResultText = "Error: Tool execution failed.";
                     setMessages(prev => prev.filter(m => m.id !== loadingId));
                 }

                 functionResponseParts.push({
                    functionResponse: {
                        name: call.name,
                        response: { result: toolResultText }
                    }
                });
            }

            // Send tool outputs back to model and get the NEXT response
            // This updates 'loopResult' so the loop continues to check the next response
            loopResult = await currentChat.sendMessage({ message: functionResponseParts });

        } else {
            // No function calls? We are done with this turn.
            break;
        }
    }
  };

  const initSession = async (role: string, context: string) => {
    try {
      const session = createSimulationSession(role, context);
      setChat(session);
      
      setIsLoading(true);
      
      // Trigger the "Setup" phase explicitly
      const response = await session.sendMessage({ message: "Begin the simulation. Generate the starting image of the workplace immediately." });
      
      // Use the robust processor to handle the initial image generation
      await processResponse(response, session);
      
      setIsLoading(false);
    } catch (e) {
      console.error("Failed to init simulation", e);
      setMessages([{
        id: 'error-init',
        role: 'model',
        text: "Failed to start simulation. Please check your connection and try again."
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
        initSession(setupData.role, `User Name: ${setupData.name}. Custom Simulation Request.`);
    }
  };

  const handleRestart = () => {
    setMessages([]);
    lastImageRef.current = null;
    if (initialRole) {
      initSession(initialRole, initialContext || `User: ${setupData.name}`);
    } else {
      initSession(setupData.role, `User Name: ${setupData.name}. Custom Simulation Request.`);
    }
  };

  const handleSend = async () => {
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
      const result = await chat.sendMessage({ message: userMsg.text });
      await processResponse(result, chat);
    } catch (err) {
      console.error("Simulation error", err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "System Error: The simulation engine encountered a glitch. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDER: SETUP SCREEN ---
  if (needsSetup) {
    return (
        <div className="flex flex-col h-[600px] max-w-2xl mx-auto glass-card rounded-2xl shadow-xl overflow-hidden animate-fadeIn relative">
             <button onClick={onExit} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-10">
                <XCircle className="w-8 h-8" />
            </button>
            <div className="flex flex-col items-center justify-center h-full text-center space-y-8 p-8 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50/50 to-transparent"></div>
                
                <div className="relative z-10 bg-white p-5 rounded-full shadow-lg border border-indigo-100 mb-4 animate-bounce-slow">
                    <Gamepad2 className="w-14 h-14 text-indigo-600" />
                </div>
                
                <div className="relative z-10 max-w-md">
                    <h2 className="text-4xl font-bold mb-3 text-slate-800 tracking-tight">Career Simulator</h2>
                    <p className="text-slate-600 text-lg">Experience a "Day in the Life" of your dream job.</p>
                </div>

                <form onSubmit={handleSetupSubmit} className="w-full max-w-sm space-y-5 relative z-10">
                    <div className="text-left">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Your Name</label>
                        <input 
                            type="text" 
                            required
                            value={setupData.name}
                            onChange={(e) => setSetupData({...setupData, name: e.target.value})}
                            className="w-full bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl p-3.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all mt-1 shadow-sm font-medium"
                            placeholder="e.g. David"
                        />
                    </div>
                    <div className="text-left">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Job Role to Simulate</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-4 w-5 h-5 text-slate-400" />
                            <input 
                                type="text" 
                                required
                                value={setupData.role}
                                onChange={(e) => setSetupData({...setupData, role: e.target.value})}
                                className="w-full bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl p-3.5 pl-10 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all mt-1 font-semibold shadow-sm"
                                placeholder="e.g. Digital Marketer"
                            />
                        </div>
                    </div>
                    <button 
                        type="submit"
                        className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                    >
                        <Play className="w-5 h-5 fill-current" /> Start Simulation
                    </button>
                </form>
            </div>
        </div>
    );
  }

  // --- RENDER: CHAT INTERFACE ---
  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto glass-card rounded-3xl shadow-2xl border border-white/50 overflow-hidden animate-fadeIn relative">
        {/* Header */}
        <div className="p-4 bg-white/40 backdrop-blur-md border-b border-white/20 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="bg-indigo-100/80 p-2.5 rounded-xl border border-indigo-200 shadow-sm">
                    <Gamepad2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h2 className="font-bold text-slate-800 text-lg hidden sm:block leading-tight">Career Simulator</h2>
                    <div className="flex items-center gap-2 text-xs">
                         <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                         <span className="text-slate-500 uppercase tracking-wide font-medium">Role:</span>
                         <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100/50">
                            {initialRole || setupData.role}
                         </span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={handleRestart}
                    className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                    title="Restart Simulation"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
                <button 
                    onClick={onExit} 
                    className="group flex items-center gap-2 px-3 py-1.5 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors border border-transparent hover:border-red-100"
                >
                    <span className="text-xs font-bold group-hover:underline decoration-red-300">EXIT</span>
                    <XCircle className="w-5 h-5" />
                </button>
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/30">
            {messages.map((msg) => (
            <div 
                key={msg.id} 
                className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fadeIn`}
            >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md border ${
                    msg.role === 'user' 
                        ? 'bg-gradient-to-br from-indigo-500 to-violet-600 border-transparent' 
                        : 'bg-white border-white'
                }`}>
                    {msg.role === 'user' 
                        ? <User className="w-5 h-5 text-white" /> 
                        : <Bot className="w-5 h-5 text-indigo-600" />
                    }
                </div>
                
                <div className={`max-w-[85%] md:max-w-[75%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    
                     {/* Tool Usage Indicator */}
                     {msg.toolUse && (
                        <div className="flex items-center gap-2 mb-2 px-4 py-1.5 bg-white/80 border border-white rounded-full text-xs text-indigo-600 font-bold shadow-sm w-fit animate-fadeIn">
                            {msg.isTyping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                            {msg.toolUse}
                        </div>
                     )}

                    {/* Image Bubble */}
                    {msg.image && (
                        <div className="mb-2 p-2 bg-white rounded-2xl shadow-md border border-slate-100 animate-fadeIn hover:shadow-lg transition-shadow">
                            <div className="relative rounded-xl overflow-hidden shadow-inner max-w-xs md:max-w-md aspect-video md:aspect-auto">
                                <img src={`data:image/png;base64,${msg.image}`} alt="Generated Content" className="w-full h-full object-cover" />
                                <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-md flex items-center gap-1.5 shadow-lg">
                                    <ImageIcon className="w-3 h-3" /> Generated by Gemini
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Text Bubble */}
                    {(msg.text || (!msg.image && !msg.toolUse)) && (
                        <div className={`p-5 rounded-2xl shadow-sm leading-relaxed text-sm md:text-base ${
                            msg.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-500/20' 
                                : 'bg-white/90 border border-white text-slate-700 rounded-tl-none shadow-sm'
                        }`}>
                            <div className="whitespace-pre-wrap">{msg.text}</div>
                        </div>
                    )}

                    <span className="text-[10px] text-slate-400 mt-1 block px-2 font-medium">
                        {msg.role === 'user' ? 'You' : 'Simulator'}
                    </span>
                </div>
            </div>
            ))}
            
            {isLoading && messages.length > 0 && !messages[messages.length-1].isTyping && (
                <div className="flex items-center gap-3 text-slate-400 pl-16 animate-fadeIn">
                    <div className="bg-white/50 px-3 py-2 rounded-full flex gap-1 h-5 items-center">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '100ms'}}></div>
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '200ms'}}></div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/60 backdrop-blur-md border-t border-white/20">
            <ConversationalInput 
                value={input}
                onChange={setInput}
                onSubmit={handleSend}
                placeholder="Make a decision (e.g., 'Fix the server')..."
                autoFocus={true}
                enableVoice={true}
            />
            <div className="mt-3 flex items-start gap-2 text-xs text-slate-500 px-1 justify-center">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 text-indigo-500 flex-shrink-0" />
                <p>AI will test your choices. You can say <b>"Generate image of..."</b> to visualize ideas.</p>
            </div>
        </div>
    </div>
  );
};

export default SimulationSession;
