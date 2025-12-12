
import React, { useState } from 'react';
import { Compass, Sparkles, Mic, MessageSquare, MessageCircle, Gamepad2, History } from 'lucide-react';
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

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
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
    setAppState(AppState.IDLE);
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={resetApp}>
            <div className="bg-emerald-600 p-1.5 rounded-xl shadow-sm group-hover:bg-emerald-700 transition-colors">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-800 to-teal-600 hidden md:block">
              CareerSage
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
             {/* Mode Toggle */}
            <div className="flex bg-slate-100 rounded-full p-1 border border-slate-200/60 shadow-inner overflow-x-auto">
                <button
                onClick={() => switchMode('text')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 ${mode === 'text' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Advisor</span>
                </button>
                <button
                onClick={() => switchMode('voice')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 ${mode === 'voice' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                <Mic className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Voice Call</span>
                </button>
                <button
                onClick={() => switchMode('chat')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 ${mode === 'chat' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quick Chat</span>
                </button>
                <button
                onClick={handleManualSimulationStart}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 ${mode === 'simulator' ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-600 hover:bg-indigo-50'}`}
                >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Simulator</span>
                </button>
            </div>

            {/* History Button */}
            <button 
                onClick={() => setShowHistory(true)}
                className="p-2.5 rounded-full bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors border border-slate-200"
                title="History"
            >
                <History className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 relative">
        
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
                <div className="text-center max-w-xl mx-auto mb-8 md:mb-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full mb-3 border border-emerald-100">
                     <Sparkles className="w-3 h-3" /> AI Career Counselor
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
                     Let's find your path.
                  </h2>
                  <p className="text-slate-500 text-sm md:text-base leading-relaxed">
                    I'm here to help you navigate your future with realistic, personalized advice. 
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
              <div className="max-w-md mx-auto text-center py-20 animate-fadeIn">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
                  <Compass className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Analysis Failed</h3>
                <p className="text-slate-600 mb-4">{errorMsg}</p>
                <button
                  onClick={() => setAppState(AppState.IDLE)}
                  className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {appState === AppState.RESULTS && result && (
              <ResultView 
                data={result} 
                onReset={resetApp} 
                onSimulate={startSimulation}
              />
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
          <p className="text-xs text-slate-400">
            Powered by Gemini 3 Pro • Educational Purpose Only
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
