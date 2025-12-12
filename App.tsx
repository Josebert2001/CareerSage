
import React, { useState } from 'react';
import { Compass, Sparkles, Mic, MessageSquare, MessageCircle, Gamepad2, History, Zap } from 'lucide-react';
import { AppState, CareerAdviceResponse, FileData, UserProfile, Pathway, ChatMessage, SavedSession } from './types';
import { generateCareerAdvice } from './services/geminiService';
import { saveSession } from './services/storage';
import InputForm from './components/InputForm';
import ResultView from './components/ResultView';
import LoadingScreen from './components/LoadingScreen';
import VoiceSession from './components/VoiceSession';
import ChatSession from './components/ChatSession';
import SimulationSession from './components/SimulationSession';
import HistoryModal from './components/HistoryModal';
import WelcomeScreen from './components/WelcomeScreen';

const App: React.FC = () => {
  // Initialize in WELCOME state
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [result, setResult] = useState<CareerAdviceResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<'text' | 'voice' | 'chat' | 'simulator'>('text');
  
  // State for Simulation
  const [simulationParams, setSimulationParams] = useState<{role: string, context: string} | null>(null);

  // State for Chat History restoration
  const [chatHistoryData, setChatHistoryData] = useState<ChatMessage[] | undefined>(undefined);

  // State for History Modal
  const [showHistory, setShowHistory] = useState(false);

  // Lifted Input State
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    situation: '',
    interests: [],
    constraints: [],
    dreams: '',
    concerns: ''
  });
  const [inputStep, setInputStep] = useState(0);

  const handleAnalyze = async (text: string, files: FileData[]) => {
    setAppState(AppState.ANALYZING);
    setErrorMsg(null);
    
    try {
      const data = await generateCareerAdvice(text, files);
      setResult(data);
      setAppState(AppState.RESULTS);
      // Auto-save successful results
      saveSession('advisor', data);
    } catch (err: any) {
      console.error(err);
      let msg = "Something went wrong while connecting to CareerSage.";
      if (err.message) msg += ` Details: ${err.message}`;
      
      setErrorMsg(msg);
      setAppState(AppState.ERROR);
    }
  };

  const getProfileNarrative = () => {
    return `
      My name is ${profile.name || "Student"}. 
      Current Situation: ${profile.situation}.
      My Interests: ${profile.interests.join(', ')}.
      My Constraints/Context: ${profile.constraints.join(', ')}.
      My Dreams/Goals: ${profile.dreams}.
      Additional Concerns: ${profile.concerns}.
      (Note: This request was triggered from a Voice Session).
    `;
  };

  const handleVoiceReportGeneration = () => {
    setMode('text');
    handleAnalyze(getProfileNarrative(), []);
  };

  const startSimulation = (pathway: Pathway) => {
    setSimulationParams({
      role: pathway.title,
      context: `User Name: ${profile.name || 'User'}. Background: ${profile.situation || 'N/A'}. Interests: ${profile.interests.join(', ')}.`
    });
    setMode('simulator');
  };

  const resetApp = () => {
    setAppState(AppState.WELCOME); // Reset to Welcome on full reset
    setResult(null);
    setErrorMsg(null);
    setInputStep(0);
    setSimulationParams(null);
    setChatHistoryData(undefined); // Clear chat history reset
    setProfile({
        name: '',
        situation: '',
        interests: [],
        constraints: [],
        dreams: '',
        concerns: ''
    });
  };

  const switchMode = (newMode: 'text' | 'voice' | 'chat' | 'simulator') => {
    // If we switch away from chat voluntarily, we clear the restored history
    // so next time it starts fresh (unless loaded from history again)
    if (mode === 'chat' && newMode !== 'chat') {
        setChatHistoryData(undefined);
    }
    setMode(newMode);
    
    if (mode === 'simulator' && newMode !== 'simulator') {
      setSimulationParams(null);
    }
  };

  const handleManualSimulationStart = () => {
    setSimulationParams(null); 
    setMode('simulator');
  };

  const handleRestoreSession = (session: SavedSession) => {
    setShowHistory(false);
    // When restoring, we skip welcome and go straight to the mode
    setAppState(AppState.IDLE); 
    
    if (session.type === 'advisor') {
        setMode('text');
        setResult(session.data as CareerAdviceResponse);
        setAppState(AppState.RESULTS);
    } else if (session.type === 'chat') {
        setChatHistoryData(session.data as ChatMessage[]);
        setMode('chat');
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800 bg-transparent">
      
      {/* Modern Top Navigation Bar */}
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${appState === AppState.WELCOME ? 'bg-transparent border-transparent pt-4' : 'bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">
          
          {/* Brand / Logo */}
          <div className="flex items-center gap-3 cursor-pointer group select-none" onClick={resetApp}>
            <div className="relative">
                <div className="absolute inset-0 bg-emerald-500 blur-sm opacity-20 group-hover:opacity-40 transition-opacity rounded-xl"></div>
                <div className="bg-gradient-to-br from-emerald-600 to-teal-500 p-2 rounded-xl shadow-lg shadow-emerald-500/10 relative z-10 group-hover:scale-105 transition-transform duration-300">
                    <Compass className="w-5 h-5 text-white" />
                </div>
            </div>
            <div className="flex flex-col">
                <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-900 to-teal-700 tracking-tight leading-none">
                    CareerSage
                </h1>
                {appState !== AppState.WELCOME && (
                  <span className="text-[10px] text-slate-400 font-medium tracking-wide">AI Guidance System</span>
                )}
            </div>
          </div>
          
          {/* Center Navigation - Pill Design */}
          {appState !== AppState.WELCOME && (
            <div className="flex-1 flex justify-center px-4">
               <nav className="flex items-center gap-1 p-1.5 bg-slate-100/80 backdrop-blur-sm rounded-full border border-slate-200/60 shadow-inner overflow-x-auto no-scrollbar max-w-full">
                  
                  <button
                    onClick={() => switchMode('text')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                        mode === 'text' 
                        ? 'bg-white text-emerald-800 shadow-sm ring-1 ring-black/5' 
                        : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <MessageSquare className={`w-4 h-4 ${mode === 'text' ? 'fill-emerald-100' : ''}`} />
                    <span className="hidden sm:inline">Advisor</span>
                  </button>

                  <button
                    onClick={() => switchMode('voice')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                        mode === 'voice' 
                        ? 'bg-white text-emerald-800 shadow-sm ring-1 ring-black/5' 
                        : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Mic className={`w-4 h-4 ${mode === 'voice' ? 'fill-emerald-100' : ''}`} />
                    <span className="hidden sm:inline">Voice</span>
                  </button>

                  <button
                    onClick={() => switchMode('chat')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                        mode === 'chat' 
                        ? 'bg-white text-emerald-800 shadow-sm ring-1 ring-black/5' 
                        : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <MessageCircle className={`w-4 h-4 ${mode === 'chat' ? 'fill-emerald-100' : ''}`} />
                    <span className="hidden sm:inline">Chat</span>
                  </button>

                  <button
                    onClick={handleManualSimulationStart}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                        mode === 'simulator' 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                        : 'text-indigo-600 hover:bg-indigo-50'
                    }`}
                  >
                    <Gamepad2 className={`w-4 h-4 ${mode === 'simulator' ? 'fill-indigo-400' : ''}`} />
                    <span className="hidden sm:inline">Sim</span>
                  </button>

               </nav>
            </div>
          )}

          {/* Right Area - Utilities */}
          {appState !== AppState.WELCOME && (
            <div className="flex items-center gap-2 sm:gap-4 justify-end">
               {/* Tech Badge */}
               <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-[11px] font-bold text-indigo-700 tracking-tight shadow-sm">
                  <Zap className="w-3.5 h-3.5 fill-indigo-400" />
                  <span>Gemini 3 Pro</span>
               </div>

               <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

               <button 
                  onClick={() => setShowHistory(true)}
                  className="group flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-emerald-700 transition-all"
                  title="View History"
               >
                  <div className="relative">
                    <History className="w-5 h-5 group-hover:rotate-[-45deg] transition-transform duration-300" />
                  </div>
                  <span className="hidden md:inline text-sm font-medium">History</span>
               </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12 relative">
        
        {/* Welcome Screen Logic */}
        {appState === AppState.WELCOME ? (
            <WelcomeScreen onStart={() => setAppState(AppState.IDLE)} />
        ) : (
            <>
                {mode === 'voice' && (
                <VoiceSession 
                    onEndSession={() => switchMode('text')} 
                    userProfile={profile}
                    onGenerateReport={handleVoiceReportGeneration}
                />
                )}

                {mode === 'chat' && (
                <ChatSession initialMessages={chatHistoryData} />
                )}

                {mode === 'simulator' && (
                    <SimulationSession 
                    initialRole={simulationParams?.role}
                    initialContext={simulationParams?.context}
                    onExit={() => switchMode('text')}
                    />
                )}

                {mode === 'text' && (
                <>
                    {appState === AppState.IDLE && (
                    <div className="animate-fadeIn">
                        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/60 backdrop-blur-sm text-emerald-700 text-xs font-bold rounded-full mb-4 border border-white shadow-sm">
                            <Sparkles className="w-3 h-3 text-emerald-500" /> Smart Advisor Mode
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-800 mb-4 tracking-tight leading-tight">
                            Tell us about <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Your Story</span>
                        </h2>
                        <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
                            Answer a few questions so Gemini 3 Pro can build your personalized roadmap.
                        </p>
                        </div>
                        
                        <InputForm 
                        profile={profile}
                        setProfile={setProfile}
                        currentStep={inputStep}
                        setCurrentStep={setInputStep}
                        onSubmit={handleAnalyze} 
                        isLoading={false} 
                        />

                    </div>
                    )}

                    {appState === AppState.ANALYZING && <LoadingScreen />}

                    {appState === AppState.ERROR && (
                    <div className="max-w-md mx-auto text-center py-20 animate-fadeIn glass-card rounded-3xl p-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-6">
                        <Compass className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Analysis Failed</h3>
                        <p className="text-slate-600 mb-6">{errorMsg}</p>
                        <button
                        onClick={() => setAppState(AppState.IDLE)}
                        className="px-8 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                        Try Again
                        </button>
                    </div>
                    )}

                    {appState === AppState.RESULTS && result && (
                    <ResultView 
                        data={result} 
                        onReset={() => setAppState(AppState.WELCOME)} 
                        onSimulate={startSimulation}
                    />
                    )}
                </>
                )}
            </>
        )}
      </main>

      <HistoryModal 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
        onSelectSession={handleRestoreSession} 
      />

      {/* Footer */}
      <footer className="py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs font-medium text-slate-400">
            Built for the Google DeepMind Vibe Code Hackathon
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
