import React, { useState } from 'react';
import { Compass, Sparkles, Mic, MessageSquare, MessageCircle } from 'lucide-react';
import { AppState, CareerAdviceResponse, FileData, UserProfile } from './types';
import { generateCareerAdvice } from './services/geminiService';
import InputForm from './components/InputForm';
import ResultView from './components/ResultView';
import LoadingScreen from './components/LoadingScreen';
import VoiceSession from './components/VoiceSession';
import ChatSession from './components/ChatSession';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<CareerAdviceResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<'text' | 'voice' | 'chat'>('text');

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
    } catch (err: any) {
      console.error(err);
      let msg = "Something went wrong while connecting to CareerSage.";
      if (err.message) msg += ` Details: ${err.message}`;
      
      setErrorMsg(msg);
      setAppState(AppState.ERROR);
    }
  };

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setResult(null);
    setErrorMsg(null);
    // Optionally reset input form, or keep it to refine
    setInputStep(0);
    setProfile({
        name: '',
        situation: '',
        interests: [],
        constraints: [],
        dreams: '',
        concerns: ''
    });
  };

  const switchMode = (newMode: 'text' | 'voice' | 'chat') => {
    setMode(newMode);
    if (appState !== AppState.IDLE) {
      if (appState === AppState.RESULTS && newMode === 'text') {
          // do nothing, keep results
      } else {
        // Don't fully reset app state so profile data persists if they switch back
        // But if they were analyzing, cancel that visually
        if (appState === AppState.ANALYZING) setAppState(AppState.IDLE);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={resetApp}>
            <div className="bg-emerald-600 p-1.5 rounded-xl shadow-sm group-hover:bg-emerald-700 transition-colors">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-800 to-teal-600">
              CareerSage
            </h1>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex bg-slate-100 rounded-full p-1 border border-slate-200/60 shadow-inner">
            <button
              onClick={() => switchMode('text')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${mode === 'text' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Advisor</span>
            </button>
            <button
              onClick={() => switchMode('voice')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${mode === 'voice' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Voice Call</span>
            </button>
            <button
              onClick={() => switchMode('chat')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${mode === 'chat' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quick Chat</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
        
        {mode === 'voice' && (
          <VoiceSession onEndSession={() => switchMode('text')} />
        )}

        {mode === 'chat' && (
           <ChatSession />
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
              <ResultView data={result} onReset={resetApp} />
            )}
          </>
        )}
      </main>

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