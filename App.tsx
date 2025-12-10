
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
    // Basic Validation
    const cleanText = text.trim();
    if (cleanText.length < 20 && files.length === 0) {
        // Show validation tip
        setErrorMsg("Please provide a bit more detail (at least 20 characters) or upload a file so we can give you the best advice!");
        setAppState(AppState.ERROR);
        return;
    }

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
      // Keep results if switching back to text, but reset for others usually
      // For now, let's allow preserving state when switching TO text, but reset when leaving text flow
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
              <span className="hidden sm:inline">Analysis</span>
            </button>
            <button
              onClick={() => switchMode('voice')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${mode === 'voice' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Mic className="w-4 h-4" />
              <span className="hidden sm:inline">Voice</span>
            </button>
            <button
              onClick={() => switchMode('chat')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${mode === 'chat' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Agent Chat</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        
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
                <div className="text-center max-w-2xl mx-auto mb-10">
                  <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
                    Find Your Path. <br/>
                    <span className="text-emerald-600">Own Your Future.</span>
                  </h2>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    Tell us about your skills, interests, and situation. We'll help you navigate education, job markets, and career choices with realistic, personalized guidance.
                  </p>
                </div>
                
                <InputForm onSubmit={handleAnalyze} isLoading={false} />

                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-center">
                  {[
                    { title: "Understanding First", desc: "We analyze your unique story, not just test scores." },
                    { title: "Realistic Pathways", desc: "Get practical steps for now and aspirational goals for later." },
                    { title: "Agentic Research", desc: "Our AI agents research real-time job market data for you." }
                  ].map((item, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                      <h3 className="font-semibold text-slate-800 mb-2">{item.title}</h3>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                  ))}
                </div>
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
                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => {
                            if (errorMsg) navigator.clipboard.writeText(errorMsg);
                        }}
                        className="text-sm text-slate-400 hover:text-slate-600 underline"
                    >
                        Copy Error Details
                    </button>
                    <button
                    onClick={() => setAppState(AppState.IDLE)}
                    className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                    >
                    Try Again
                    </button>
                </div>
              </div>
            )}

            {appState === AppState.RESULTS && result && (
              <ResultView data={result} onReset={resetApp} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} CareerSage. Powered by Gemini 3 Pro.
          </p>
          <p className="text-xs text-slate-400 mt-2 max-w-2xl mx-auto">
            Disclaimer: CareerSage uses Artificial Intelligence to provide guidance. This information is for educational purposes only and does not constitute professional financial, legal, or binding career advice. Always verify information with local institutions.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
