
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
  const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
  const [result, setResult] = useState<CareerAdviceResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<'text' | 'voice' | 'chat' | 'simulator'>('text');
  const [simulationParams, setSimulationParams] = useState<{role: string, context: string} | null>(null);
  const [chatHistoryData, setChatHistoryData] = useState<ChatMessage[] | undefined>(undefined);
  const [showHistory, setShowHistory] = useState(false);

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
      saveSession('advisor', data);
    } catch (err: any) {
      console.error(err);
      if (err.message === "API_KEY_MISSING") {
        if (window.aistudio?.openSelectKey) await window.aistudio.openSelectKey();
        setErrorMsg("Unable to connect. Please check your configuration and try again.");
      } else {
        let msg = "Something went wrong while connecting to CareerSage.";
        if (err.message) msg += ` Details: ${err.message}`;
        setErrorMsg(msg);
      }
      setAppState(AppState.ERROR);
    }
  };

  const getProfileNarrative = () => `
    My name is ${profile.name || "Student"}.
    Current Situation: ${profile.situation}.
    My Interests: ${profile.interests.join(', ')}.
    My Constraints/Context: ${profile.constraints.join(', ')}.
    My Dreams/Goals: ${profile.dreams}.
    Additional Concerns: ${profile.concerns}.
    (Note: This request was triggered from a Voice Session).
  `;

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
    setAppState(AppState.WELCOME);
    setResult(null);
    setErrorMsg(null);
    setInputStep(0);
    setSimulationParams(null);
    setChatHistoryData(undefined);
    setProfile({ name: '', situation: '', interests: [], constraints: [], dreams: '', concerns: '' });
  };

  const switchMode = (newMode: 'text' | 'voice' | 'chat' | 'simulator') => {
    if (mode === 'chat' && newMode !== 'chat') setChatHistoryData(undefined);
    setMode(newMode);
    if (mode === 'simulator' && newMode !== 'simulator') setSimulationParams(null);
  };

  const handleManualSimulationStart = () => {
    setSimulationParams(null);
    setMode('simulator');
  };

  const handleRestoreSession = (session: SavedSession) => {
    setShowHistory(false);
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

  /* ── Nav button classes ─────────────────────────── */
  const navBtn = (active: boolean, variant: 'brand' | 'amber' = 'brand') => {
    const activeStyles = variant === 'amber'
      ? 'bg-amber-500 text-white shadow-md shadow-amber-400/25'
      : 'bg-white text-emerald-900 shadow-sm ring-1 ring-black/5';
    const idleStyles = variant === 'amber'
      ? 'text-amber-700 hover:text-amber-900 hover:bg-amber-50/70'
      : 'text-slate-500 hover:text-slate-900 hover:bg-white/60';
    return `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap ${active ? activeStyles : idleStyles}`;
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800 bg-transparent">

      {/* ── Header ─────────────────────────────────── */}
      <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        appState === AppState.WELCOME
          ? 'bg-transparent border-transparent pt-4'
          : 'bg-white/68 backdrop-blur-2xl border-b border-white/50 shadow-[0_1px_12px_rgba(0,0,0,0.06)]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[68px] flex items-center justify-between gap-4">

          {/* Brand */}
          <button
            onClick={resetApp}
            className="flex items-center gap-2.5 group select-none shrink-0 focus-visible:outline-none"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 blur-md opacity-0 group-hover:opacity-30 transition-opacity rounded-xl" />
              <div className="brand-gradient p-2 rounded-xl shadow-md shadow-emerald-800/15 relative z-10 group-hover:scale-105 transition-transform duration-300">
                <Compass className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[17px] font-black tracking-tight brand-text-gradient">
                CareerSage
              </span>
              {appState !== AppState.WELCOME && (
                <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5">
                  AI Guidance
                </span>
              )}
            </div>
          </button>

          {/* Centre nav */}
          {appState !== AppState.WELCOME && (
            <div className="flex-1 flex justify-center min-w-0">
              <nav className="flex items-center gap-1 p-1.5 bg-slate-100/80 backdrop-blur-sm rounded-full border border-slate-200/60 shadow-inner overflow-x-auto no-scrollbar">
                <button onClick={() => switchMode('text')} className={navBtn(mode === 'text')}>
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Advisor</span>
                </button>
                <button onClick={() => switchMode('voice')} className={navBtn(mode === 'voice')}>
                  <Mic className="w-4 h-4" />
                  <span className="hidden sm:inline">Voice</span>
                </button>
                <button onClick={() => switchMode('chat')} className={navBtn(mode === 'chat')}>
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Chat</span>
                </button>
                <button onClick={handleManualSimulationStart} className={navBtn(mode === 'simulator', 'amber')}>
                  <Gamepad2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Simulate</span>
                </button>
              </nav>
            </div>
          )}

          {/* Right */}
          {appState !== AppState.WELCOME && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full text-[11px] font-bold text-emerald-700 tracking-tight">
                <Zap className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                <span>AI-Powered</span>
              </div>

              <div className="h-7 w-px bg-slate-200 hidden md:block" />

              <button
                onClick={() => setShowHistory(true)}
                title="View History"
                className="group flex items-center gap-1.5 px-3 py-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-emerald-700 transition-all text-sm font-medium"
              >
                <History className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform duration-300" />
                <span className="hidden md:inline">History</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Main Content ────────────────────────────── */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12 relative">

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
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/70 backdrop-blur-sm text-emerald-700 text-xs font-bold rounded-full mb-5 border border-emerald-100 shadow-sm">
                        <Sparkles className="w-3 h-3 text-emerald-500" />
                        Smart Advisor Mode
                      </div>
                      <h2 className="text-3xl md:text-5xl font-black text-slate-800 mb-4 tracking-tight leading-tight">
                        Tell us about <br />
                        <span className="brand-text-gradient">Your Story</span>
                      </h2>
                      <p className="text-slate-500 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
                        Answer a few questions to build your personalized roadmap.
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
                  <div className="max-w-md mx-auto text-center py-20 animate-fadeIn solid-card rounded-3xl p-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 border border-red-100 mb-6">
                      <Compass className="w-7 h-7 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Analysis Failed</h3>
                    <p className="text-slate-500 mb-8 text-sm leading-relaxed">{errorMsg}</p>
                    <button
                      onClick={() => setAppState(AppState.IDLE)}
                      className="px-8 py-3 brand-gradient text-white rounded-full font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
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

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-400 font-medium">
            Made for Nigerian students
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
