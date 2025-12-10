
import React, { useState } from 'react';
import { Compass, Sparkles, Mic, MessageSquare, MessageCircle } from 'lucide-react';
import { AppState, CareerAdviceResponse, FileData } from './types';
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
  };

  const switchMode = (newMode: 'text' | 'voice' | 'chat') => {
    setMode(newMode);
    if (appState !== AppState.IDLE) {
      if (appState === AppState.RESULTS && newMode === 'text') {
          // do nothing, keep results
      } else {
        resetApp();
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={resetApp}>
            <div className="bg-emerald-600 p-1.5 rounded-lg">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-teal-500">
              CareerSage
            </h1>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex bg-slate-100 rounded-full p-1 border border-slate-200 overflow-x-auto">
            <button
              onClick={() => switchMode('text')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${mode === 'text' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Advisor</span>
            </button>
            <button
              onClick={() => switchMode('voice')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${mode === 'voice' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Mic className="w-4 h-4" />
              <span className="hidden sm:inline">Voice Call</span>
            </button>
            <button
              onClick={() => switchMode('chat')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${mode === 'chat' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Quick Chat</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        
        {mode === 'voice' && (
          <VoiceSession onEndSession={() => switchMode('text')} />
        )}

        {mode === 'chat' && (
           <ChatSession />
        )}

        {mode === 'text' && (
          <>
            {appState === AppState.IDLE && (
              <div className="flex flex-col items-center animate-fadeIn">
                <div className="text-center max-w-2xl mx-auto mb-8">
                  <h2 className="text-2xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                    Let's Build Your Future, Together.
                  </h2>
                  <p className="text-slate-600">
                    Answer a few questions so I can get to know you. No wrong answers!
                  </p>
                </div>
                
                <InputForm onSubmit={handleAnalyze} isLoading={false} />

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
      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} CareerSage. Powered by Gemini 3 Pro.
          </p>
          <p className="text-xs text-slate-400 mt-2 max-w-2xl mx-auto">
            Disclaimer: CareerSage uses Artificial Intelligence to provide guidance. This information is for educational purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
