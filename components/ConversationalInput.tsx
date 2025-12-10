import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, StopCircle } from 'lucide-react';

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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleVoiceToggle = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice input is not supported in this browser.");
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
              className={`p-2 rounded-xl transition-all ${
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
            className={`p-2 rounded-xl transition-all ${
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
    </div>
  );
};

export default ConversationalInput;