
import React, { useState, useEffect, useRef } from 'react';
import { ChatSession as GenAIChatSession, GenerateContentResponse } from '@google/genai';
import { createSimulationSession, generateSimulationImage, editSimulationImage } from '../services/geminiService';
import { ChatMessage } from '../types';
import { User, Gamepad2, AlertCircle, XCircle, Play, ChevronRight, Briefcase, Bot, Image as ImageIcon, Wand2, Loader2 } from 'lucide-react';
import ConversationalInput from './ConversationalInput';

interface SimulationSessionProps {
  initialRole?: string;
  initialContext?: string;
  onExit: () => void;
}

const SimulationSession: React.FC<SimulationSessionProps> = ({ initialRole, initialContext, onExit }) => {
  const [chat, setChat] = useState<GenAIChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastImage, setLastImage] = useState<string | null>(null); // Store last image for editing
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

  const initSession = (role: string, context: string) => {
    try {
      const session = createSimulationSession(role, context);
      setChat(session);
      
      setIsLoading(true);
      session.sendMessage({ message: "START_SIMULATION" }).then((response) => {
          setMessages([{
            id: 'init',
            role: 'model',
            text: response.text || "Ready to start simulation..."
          }]);
          setIsLoading(false);
      });
    } catch (e) {
      console.error("Failed to init simulation", e);
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
      let result = await chat.sendMessage({ message: userMsg.text });
      
      // Handle Tool Calls (Image Generation/Editing)
      // The loop handles cases where the model calls a tool, we send output, and it generates text.
      while (result.functionCalls && result.functionCalls.length > 0) {
        const call = result.functionCalls[0]; // Assuming single tool call for now
        const functionResponseParts: any[] = [];
        let toolResultText = "";

        if (call.name === 'generate_image') {
          const prompt = call.args['prompt'] as string;
          
          // Show "Generating..." status in UI (optional, or just wait)
          setMessages(prev => [...prev, { id: 'sys-'+Date.now(), role: 'model', text: '', isTyping: true, toolUse: 'Generating image...' }]);
          
          try {
            const imageData = await generateSimulationImage(prompt);
            setLastImage(imageData); // Update context for editing
            
            // Remove the loading indicator and add the image message
            setMessages(prev => {
                const filtered = prev.filter(m => !m.isTyping);
                return [...filtered, {
                    id: 'img-'+Date.now(),
                    role: 'model',
                    text: `Generated: ${prompt}`,
                    image: imageData
                }];
            });

            toolResultText = "Image generated successfully and displayed to user.";

          } catch (e) {
            console.error("Image gen error", e);
            toolResultText = "Error: Failed to generate image.";
            setMessages(prev => prev.filter(m => !m.isTyping)); // Clear loading
          }
        } 
        else if (call.name === 'edit_image') {
          const instruction = call.args['instruction'] as string;
          
          if (!lastImage) {
            toolResultText = "Error: No previous image found to edit. Ask user to generate one first.";
          } else {
             // Show "Editing..." status
            setMessages(prev => [...prev, { id: 'sys-'+Date.now(), role: 'model', text: '', isTyping: true, toolUse: 'Editing image...' }]);
            
            try {
              const imageData = await editSimulationImage(lastImage, instruction);
              setLastImage(imageData);
              
               setMessages(prev => {
                const filtered = prev.filter(m => !m.isTyping);
                return [...filtered, {
                    id: 'img-edit-'+Date.now(),
                    role: 'model',
                    text: `Edited: ${instruction}`,
                    image: imageData
                }];
              });

              toolResultText = "Image edited successfully and displayed to user.";
            } catch (e) {
              console.error("Image edit error", e);
              toolResultText = "Error: Failed to edit image.";
              setMessages(prev => prev.filter(m => !m.isTyping));
            }
          }
        }

        // Send function response back to model
        functionResponseParts.push({
            functionResponse: {
                name: call.name,
                response: { result: toolResultText }
            }
        });

        // Get the model's follow-up text
        result = await chat.sendMessage(functionResponseParts);
      }

      // Add the final text response from model (if any)
      if (result.text) {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            text: result.text
        }]);
      }

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
        <div className="flex flex-col h-[600px] max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fadeIn relative">
             <button onClick={onExit} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-10">
                <XCircle className="w-8 h-8" />
            </button>
            <div className="flex flex-col items-center justify-center h-full text-center space-y-8 p-8 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50 to-transparent"></div>
                
                <div className="relative z-10 bg-white p-4 rounded-full shadow-lg border border-indigo-100 mb-4 animate-bounce-slow">
                    <Gamepad2 className="w-12 h-12 text-indigo-600" />
                </div>
                
                <div className="relative z-10 max-w-md">
                    <h2 className="text-3xl font-bold mb-2 text-slate-800">Career Simulator</h2>
                    <p className="text-slate-500 text-lg">Experience a "Day in the Life" of your dream job before you commit.</p>
                </div>

                <form onSubmit={handleSetupSubmit} className="w-full max-w-sm space-y-5 relative z-10">
                    <div className="text-left">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Your Name</label>
                        <input 
                            type="text" 
                            required
                            value={setupData.name}
                            onChange={(e) => setSetupData({...setupData, name: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all mt-1 shadow-sm"
                            placeholder="e.g. David"
                        />
                    </div>
                    <div className="text-left">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Job Role to Simulate</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                            <input 
                                type="text" 
                                required
                                value={setupData.role}
                                onChange={(e) => setSetupData({...setupData, role: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-10 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all mt-1 font-semibold shadow-sm"
                                placeholder="e.g. Digital Marketer"
                            />
                        </div>
                    </div>
                    <button 
                        type="submit"
                        className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-indigo-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
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
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fadeIn relative">
        {/* Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-lg border border-indigo-200">
                    <Gamepad2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h2 className="font-bold text-slate-800 text-lg hidden sm:block">Career Simulator</h2>
                    <div className="flex items-center gap-1.5 text-xs">
                         <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                         <span className="text-slate-500 uppercase tracking-wide font-medium">Scenario:</span>
                         <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {initialRole || setupData.role}
                         </span>
                    </div>
                </div>
            </div>
            <button 
                onClick={onExit} 
                className="group flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors border border-transparent hover:border-red-100"
            >
                <span className="text-xs font-bold group-hover:underline decoration-red-300">END SESSION</span>
                <XCircle className="w-5 h-5" />
            </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/50">
            {messages.map((msg) => (
            <div 
                key={msg.id} 
                className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border ${
                    msg.role === 'user' 
                        ? 'bg-indigo-600 border-indigo-600' 
                        : 'bg-white border-slate-200'
                }`}>
                    {msg.role === 'user' 
                        ? <User className="w-5 h-5 text-white" /> 
                        : <Bot className="w-5 h-5 text-indigo-600" />
                    }
                </div>
                
                <div className={`max-w-[85%] md:max-w-[75%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    
                     {/* Tool Usage Indicator */}
                     {msg.toolUse && (
                        <div className="flex items-center gap-2 mb-2 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs text-slate-500 font-medium shadow-sm w-fit animate-fadeIn">
                            {msg.isTyping ? <Loader2 className="w-3 h-3 animate-spin text-indigo-500" /> : <Wand2 className="w-3 h-3 text-indigo-500" />}
                            {msg.toolUse}
                        </div>
                     )}

                    {/* Image Bubble */}
                    {msg.image && (
                        <div className="mb-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm animate-fadeIn">
                            <div className="relative rounded-xl overflow-hidden shadow-inner max-w-xs md:max-w-sm">
                                <img src={`data:image/png;base64,${msg.image}`} alt="Generated Content" className="w-full h-auto object-cover" />
                                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1">
                                    <ImageIcon className="w-3 h-3" /> Generated by AI
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Text Bubble */}
                    {(msg.text || (!msg.image && !msg.toolUse)) && (
                        <div className={`p-5 rounded-2xl shadow-sm leading-relaxed text-sm md:text-base ${
                            msg.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-tr-none' 
                                : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                        }`}>
                            <div className="whitespace-pre-wrap">{msg.text}</div>
                        </div>
                    )}

                    <span className="text-[10px] text-slate-400 mt-1 block px-1">
                        {msg.role === 'user' ? 'You' : 'Simulator'}
                    </span>
                </div>
            </div>
            ))}
            
            {isLoading && messages.length > 0 && !messages[messages.length-1].isTyping && (
                <div className="flex items-center gap-3 text-slate-400 pl-14 animate-fadeIn">
                    <div className="flex gap-1 h-2">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '100ms'}}></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '200ms'}}></div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
            <ConversationalInput 
                value={input}
                onChange={setInput}
                onSubmit={handleSend}
                placeholder="Type action, or say 'Generate image of...'"
                autoFocus={true}
                enableVoice={true}
            />
            <div className="mt-3 flex items-start gap-2 text-xs text-slate-400 px-1 justify-center">
                <AlertCircle className="w-3 h-3 mt-0.5 text-indigo-400 flex-shrink-0" />
                <p>AI can make mistakes. You can ask to <b>generate images</b> or <b>edit them</b>.</p>
            </div>
        </div>
    </div>
  );
};

export default SimulationSession;
