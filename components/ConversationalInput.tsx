import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, StopCircle, AlertCircle } from 'lucide-react';

interface ConversationalInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  enableVoice?: boolean;
}

const ConversationalInput: React.FC<ConversationalInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Type your answer...",
  autoFocus = false,
  enableVoice = true
}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  const handleVoiceToggle = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setVoiceError("Voice input is not supported in this browser.");
      setTimeout(() => setVoiceError(null), 4000);
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-NG'; // Preference for Nigerian English

    recognitionRef.current.onstart = () => setIsListening(true);
    
    recognitionRef.current.onresult = (event: any) => {
      let final = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (final) {
        onChange(value + (value ? ' ' : '') + final);
      }
      setInterimTranscript(interim);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        onSubmit();
      }
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <div className="w-full relative">
      <div className={`relative flex items-end gap-2 bg-white border-2 rounded-2xl p-2 transition-colors ${isListening ? 'border-emerald-500 shadow-md ring-2 ring-emerald-100' : 'border-slate-200 focus-within:border-emerald-400'}`}>
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening..." : placeholder}
          className="w-full bg-transparent border-none focus:ring-0 resize-none min-h-[44px] max-h-[120px] py-2.5 px-2 text-base text-slate-800 placeholder:text-slate-400"
          rows={1}
        />
        
        <div className="flex gap-2 pb-1 pr-1">
          {enableVoice && (
            <button
              onClick={handleVoiceToggle}
              aria-label={isListening ? "Stop voice recording" : "Start voice input"}
              className={`p-2 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                isListening
                  ? 'bg-red-50 text-red-600 animate-pulse'
                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
              title={isListening ? "Stop recording" : "Use voice"}
            >
              {isListening ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={onSubmit}
            disabled={!value.trim()}
            aria-label="Send message"
            className={`p-2 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
              value.trim()
                ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {interimTranscript && (
        <div className="absolute -top-8 left-0 text-sm text-slate-500 italic animate-pulse flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          {interimTranscript}...
        </div>
      )}

      {voiceError && (
        <div role="alert" className="absolute -bottom-12 left-0 right-0 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 animate-fadeIn">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{voiceError}</span>
        </div>
      )}
    </div>
  );
};

export default ConversationalInput;