
import React, { useState, useRef, useEffect } from 'react';
import { FileData, UserProfile } from '../types';
import { Send, X, Mic, MicOff, ArrowRight, ArrowLeft, Check, Sparkles, Paperclip, ChevronRight } from 'lucide-react';

interface InputFormProps {
  onSubmit: (text: string, files: FileData[]) => void;
  isLoading: boolean;
}

// Definition of the steps
const STEPS = [
  { id: 'name', title: 'Introduction' },
  { id: 'situation', title: 'Current Status' },
  { id: 'interests', title: 'Interests' },
  { id: 'constraints', title: 'Context' },
  { id: 'dreams', title: 'Aspirations' },
  { id: 'docs', title: 'Documents' }
];

const SITUATION_OPTIONS = [
  "I'm in Secondary School (SS1-SS3)",
  "I'm preparing for JAMB/WAEC",
  "I'm a University Undergraduate",
  "I'm a Fresh Graduate / NYSC",
  "I'm Working / Career Switcher"
];

const INTEREST_OPTIONS = [
  "Mathematics", "Coding/Tech", "Creative Arts", "Business/Sales", 
  "Sports", "Writing", "Science/Biology", "Public Speaking", 
  "Helping People", "Fixing Things"
];

const CONSTRAINT_OPTIONS = [
  "Need to earn money ASAP",
  "Limited financial support",
  "Family pressure on career choice",
  "Looking for scholarships",
  "Willing to relocate",
  "Flexible situation"
];

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    situation: '',
    interests: [],
    constraints: [],
    dreams: '',
    concerns: ''
  });
  const [files, setFiles] = useState<FileData[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when step changes
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentStep]);

  // --- Voice Input Logic ---
  const handleVoiceInput = (field: keyof UserProfile) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-NG'; // Bias towards Nigerian English accent if possible

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      setInterimTranscript(interim);
      
      if (finalTranscript) {
        // Append to existing text
        const currentVal = profile[field];
        const newVal = Array.isArray(currentVal) ? currentVal : (currentVal ? `${currentVal} ${finalTranscript}` : finalTranscript);
        
        if (typeof newVal === 'string') {
           setProfile(prev => ({ ...prev, [field]: newVal }));
        }
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognition.start();
  };


  // --- Event Handlers ---

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      submitForm();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: FileData[] = [];
      const fileList = Array.from(e.target.files) as File[];

      let processedCount = 0;
      fileList.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const base64String = (event.target.result as string).split(',')[1];
            newFiles.push({
              name: file.name,
              mimeType: file.type,
              data: base64String
            });
          }
          processedCount++;
          if (processedCount === fileList.length) {
            setFiles(prev => [...prev, ...newFiles]);
          }
        };
        reader.readAsDataURL(file);
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const submitForm = () => {
    // Construct the narrative prompt
    const narrative = `
      My name is ${profile.name}. 
      Current Situation: ${profile.situation}.
      My Interests: ${profile.interests.join(', ')}.
      My Constraints/Context: ${profile.constraints.join(', ')}.
      My Dreams/Goals: ${profile.dreams}.
      Additional Concerns: ${profile.concerns}.
    `;
    onSubmit(narrative, files);
  };

  // --- Render Steps ---

  const renderBubble = (text: string, isAi: boolean = true) => (
    <div className={`flex w-full mb-4 ${isAi ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] gap-3 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
        {isAi && (
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1">
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
        )}
        <div className={`p-4 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm ${
          isAi 
            ? 'bg-white text-slate-700 rounded-tl-none border border-slate-100' 
            : 'bg-emerald-600 text-white rounded-tr-none'
        }`}>
          {text}
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Name
        return (
          <div className="animate-fadeIn space-y-4">
            {renderBubble("Hi! I'm CareerSage 👋 I'm here to help you navigate your future. First things first, what should I call you?")}
            <div className="flex justify-end">
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Type your name..."
                className="w-full md:w-2/3 p-4 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:outline-none text-lg bg-white"
                onKeyDown={(e) => e.key === 'Enter' && profile.name && handleNext()}
                autoFocus
              />
            </div>
          </div>
        );

      case 1: // Situation
        return (
          <div className="animate-fadeIn space-y-4">
             {profile.name && renderBubble(`Nice to meet you, ${profile.name}!`, true)}
             {renderBubble("What describes your current situation best?", true)}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pl-4 md:pl-12">
               {SITUATION_OPTIONS.map((opt) => (
                 <button
                   key={opt}
                   onClick={() => {
                     setProfile({ ...profile, situation: opt });
                     setTimeout(handleNext, 300); // Auto advance for single select
                   }}
                   className={`p-4 rounded-xl text-left border-2 transition-all hover:scale-[1.02] active:scale-95 ${
                     profile.situation === opt 
                       ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-md' 
                       : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300'
                   }`}
                 >
                   <div className="flex items-center justify-between">
                     <span>{opt}</span>
                     {profile.situation === opt && <Check className="w-4 h-4 text-emerald-600" />}
                   </div>
                 </button>
               ))}
             </div>
          </div>
        );

      case 2: // Interests
        return (
          <div className="animate-fadeIn space-y-4">
            {renderBubble("Got it. Now, what subjects or activities do you actually enjoy?", true)}
            <div className="flex flex-wrap gap-2 pl-4 md:pl-12">
              {INTEREST_OPTIONS.map((interest) => {
                const isSelected = profile.interests.includes(interest);
                return (
                  <button
                    key={interest}
                    onClick={() => {
                      const newInterests = isSelected
                        ? profile.interests.filter(i => i !== interest)
                        : [...profile.interests, interest];
                      setProfile({ ...profile, interests: newInterests });
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
            {/* Custom Interest Input */}
            <div className="pl-4 md:pl-12 mt-2">
                 <input 
                    type="text" 
                    placeholder="+ Add another interest"
                    className="text-sm border-b border-slate-300 bg-transparent focus:outline-none focus:border-emerald-500 py-1 w-48"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const val = e.currentTarget.value.trim();
                            if (val && !profile.interests.includes(val)) {
                                setProfile(p => ({ ...p, interests: [...p.interests, val] }));
                                e.currentTarget.value = '';
                            }
                        }
                    }}
                 />
            </div>
          </div>
        );

      case 3: // Constraints
        return (
          <div className="animate-fadeIn space-y-4">
             {renderBubble("Life happens. Is there anything specific about your family situation or finances I should keep in mind?", true)}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4 md:pl-12">
               {CONSTRAINT_OPTIONS.map((opt) => {
                 const isSelected = profile.constraints.includes(opt);
                 return (
                    <button
                        key={opt}
                        onClick={() => {
                        const newConstraints = isSelected
                            ? profile.constraints.filter(i => i !== opt)
                            : [...profile.constraints, opt];
                        setProfile({ ...profile, constraints: newConstraints });
                        }}
                        className={`p-3 rounded-xl text-left border transition-all ${
                        isSelected 
                            ? 'border-orange-400 bg-orange-50 text-orange-900' 
                            : 'border-slate-200 bg-white text-slate-600 hover:border-orange-200'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-orange-400 border-orange-400' : 'border-slate-300'}`}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span>{opt}</span>
                        </div>
                    </button>
                 );
               })}
             </div>
          </div>
        );

      case 4: // Dreams (Voice Enabled)
        return (
          <div className="animate-fadeIn space-y-4">
            {renderBubble("This is the most important part. What are your career dreams? Even if they seem impossible right now.", true)}
            <div className="pl-4 md:pl-12 relative">
               <textarea
                 value={profile.dreams}
                 onChange={(e) => setProfile({ ...profile, dreams: e.target.value })}
                 placeholder="I want to be a software engineer, or maybe start my own business..."
                 className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:outline-none min-h-[120px] bg-white resize-none"
               />
               <button
                 type="button"
                 onClick={() => handleVoiceInput('dreams')}
                 className={`absolute bottom-4 right-4 p-2 rounded-full transition-all ${
                   isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-600'
                 }`}
                 title="Speak your answer"
               >
                 {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
               </button>
               {interimTranscript && (
                 <p className="text-xs text-slate-400 mt-2 italic animate-pulse">
                   Listening: {interimTranscript}...
                 </p>
               )}
            </div>
          </div>
        );

      case 5: // Documents & Review
        return (
          <div className="animate-fadeIn space-y-6">
            {renderBubble("Almost there! Do you have any exam results (WAEC/JAMB), a CV, or notes you want me to look at?", true)}
            
            <div className="pl-4 md:pl-12">
               {/* File Upload Area */}
               <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                   <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*,application/pdf"
                    />
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                        <Paperclip className="w-8 h-8 text-slate-400" />
                        <span className="text-sm font-medium">Click to upload files (Optional)</span>
                    </div>
               </div>

                {/* File Previews */}
                {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                    {files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg text-sm text-emerald-800 border border-emerald-100">
                        <span className="truncate max-w-[150px]">{file.name}</span>
                        <button type="button" onClick={() => setFiles(files.filter((_, i) => i !== idx))}>
                           <X className="w-3 h-3" />
                        </button>
                    </div>
                    ))}
                </div>
                )}
            </div>

            {renderBubble("Ready to see your personalized career roadmap?", true)}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col h-[600px] md:h-auto md:min-h-[500px]">
      
      {/* Progress Header */}
      <div className="mb-6 px-1">
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm font-semibold text-emerald-700">Step {currentStep + 1} of {STEPS.length}</span>
          <span className="text-xs text-slate-400 uppercase tracking-wider">{STEPS[currentStep].title}</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Conversation Area */}
      <div className="flex-1 bg-white md:bg-transparent rounded-2xl md:rounded-none p-4 md:p-0 overflow-y-auto mb-4 border border-slate-100 md:border-none shadow-sm md:shadow-none">
        {/* History of previous steps (Simplified View) */}
        {currentStep > 0 && (
             <div className="space-y-4 mb-8 opacity-50 hover:opacity-100 transition-opacity duration-300">
                {profile.name && currentStep > 0 && renderBubble(profile.name, false)}
                {profile.situation && currentStep > 1 && renderBubble(profile.situation, false)}
                {profile.interests.length > 0 && currentStep > 2 && renderBubble(profile.interests.join(', '), false)}
             </div>
        )}
        
        {/* Current Active Step */}
        {renderStepContent()}
        <div ref={chatEndRef} />
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 md:border-none mt-auto">
        <button
          onClick={handleBack}
          disabled={currentStep === 0 || isLoading}
          className={`flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-800 transition-colors ${currentStep === 0 ? 'invisible' : ''}`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={isLoading || (currentStep === 0 && !profile.name)}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95
            ${isLoading ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}
          `}
        >
          {isLoading ? (
            <span>Processing...</span>
          ) : currentStep === STEPS.length - 1 ? (
            <>
              Generate Plan <Send className="w-4 h-4" />
            </>
          ) : (
            <>
              Next <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InputForm;
