import React, { useRef, useEffect, useState } from 'react';
import { FileData, UserProfile } from '../types';
import { ArrowLeft, Check, Sparkles, Paperclip, X } from 'lucide-react';
import ConversationalInput from './ConversationalInput';

interface InputFormProps {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  onSubmit: (text: string, files: FileData[]) => void;
  isLoading: boolean;
}

// Updated STEPS to include Concerns
const STEPS = [
  { id: 'name', title: 'Intro' },
  { id: 'situation', title: 'Status' },
  { id: 'interests', title: 'Interests' },
  { id: 'constraints', title: 'Context' },
  { id: 'dreams', title: 'Dreams' },
  { id: 'concerns', title: 'Concerns' },
  { id: 'docs', title: 'Docs' }
];

const SITUATION_OPTIONS = [
  "Secondary School (SS1-SS3)",
  "Preparing for JAMB/WAEC",
  "University Undergraduate",
  "Fresh Graduate / NYSC",
  "Working / Career Switcher"
];

const INTEREST_OPTIONS = [
  "Mathematics", "Coding/Tech", "Creative Arts", "Business/Sales", 
  "Sports", "Writing", "Science/Biology", "Public Speaking", 
  "Helping People", "Fixing Things"
];

const CONSTRAINT_OPTIONS = [
  "Need to earn money ASAP",
  "Limited financial support",
  "Family pressure on choice",
  "Looking for scholarships",
  "Willing to relocate",
  "Flexible situation"
];

const InputForm: React.FC<InputFormProps> = ({ 
  profile, 
  setProfile, 
  currentStep, 
  setCurrentStep, 
  onSubmit, 
  isLoading 
}) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [currentStep]);

  // Simulate AI typing effect when entering a new step
  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => setIsTyping(false), 600);
    return () => clearTimeout(timer);
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitForm();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
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

  // --- Render Helpers ---

  const renderBubble = (text: React.ReactNode, isAi: boolean = true) => (
    <div className={`flex w-full mb-6 ${isAi ? 'justify-start' : 'justify-end'} animate-fadeIn`}>
      <div className={`flex max-w-[90%] md:max-w-[75%] gap-3 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
        {isAi && (
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1 border border-emerald-200">
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
        )}
        <div className={`p-4 text-sm md:text-base leading-relaxed shadow-sm ${
          isAi 
            ? 'bg-white text-slate-700 rounded-2xl rounded-tl-none border border-slate-100' 
            : 'bg-emerald-600 text-white rounded-2xl rounded-tr-none'
        }`}>
          {text}
        </div>
      </div>
    </div>
  );

  const TypingIndicator = () => (
    <div className="flex w-full mb-6 justify-start animate-fadeIn">
       <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-1">
             <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-50 shadow-sm flex gap-1 items-center h-[52px]">
             <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
             <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
             <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
       </div>
    </div>
  );

  const renderStepContent = () => {
    if (isTyping) return <TypingIndicator />;

    switch (currentStep) {
      case 0: // Name
        return (
          <div className="space-y-6">
            {renderBubble("Hi! I'm CareerSage 👋 I'm here to help you navigate your future. First things first, what should I call you?")}
            <div className="pl-11">
              <ConversationalInput 
                value={profile.name}
                onChange={(val) => setProfile({ ...profile, name: val })}
                onSubmit={handleNext}
                placeholder="My name is..."
                autoFocus
              />
            </div>
          </div>
        );

      case 1: // Situation
        return (
          <div className="space-y-6">
             {renderBubble(<>Nice to meet you, <strong>{profile.name}</strong>! What describes your current situation best?</>, true)}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-11">
               {SITUATION_OPTIONS.map((opt) => (
                 <button
                   key={opt}
                   onClick={() => {
                     setProfile({ ...profile, situation: opt });
                     setTimeout(handleNext, 300);
                   }}
                   className={`p-4 rounded-xl text-left border-2 transition-all hover:scale-[1.02] active:scale-95 ${
                     profile.situation === opt 
                       ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-medium shadow-sm' 
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
          <div className="space-y-6">
            {renderBubble("Got it. Now, which subjects or activities do you naturally gravitate towards?", true)}
            <div className="pl-11">
                <div className="flex flex-wrap gap-2 mb-4">
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
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50'
                        }`}
                    >
                        {interest}
                    </button>
                    );
                })}
                </div>
                
                <div className="flex justify-end mt-4">
                    <button 
                        onClick={handleNext} 
                        disabled={profile.interests.length === 0}
                        className={`px-6 py-2 rounded-full font-semibold transition-all ${
                            profile.interests.length > 0 ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        Continue
                    </button>
                </div>
            </div>
          </div>
        );

      case 3: // Constraints
        return (
          <div className="space-y-6">
             {renderBubble("Life is complex. Is there anything specific about your family situation or finances I should keep in mind?", true)}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-11">
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
                            ? 'border-orange-400 bg-orange-50 text-orange-900 shadow-sm' 
                            : 'border-slate-200 bg-white text-slate-600 hover:border-orange-200'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-orange-400 border-orange-400' : 'border-slate-300 bg-white'}`}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span>{opt}</span>
                        </div>
                    </button>
                 );
               })}
             </div>
             <div className="pl-11 flex justify-end">
                <button onClick={handleNext} className="text-sm text-slate-500 hover:text-emerald-600 underline decoration-slate-300 underline-offset-4">
                    Skip / None apply
                </button>
                {profile.constraints.length > 0 && (
                     <button 
                     onClick={handleNext} 
                     className="ml-4 px-6 py-2 rounded-full font-semibold bg-slate-800 text-white hover:bg-slate-700"
                    >
                     Continue
                    </button>
                )}
             </div>
          </div>
        );

      case 4: // Dreams
        return (
          <div className="space-y-6">
            {renderBubble(<>This is the most important part. <strong>What are your career dreams?</strong> Even if they seem impossible right now.</>, true)}
            <div className="pl-11">
                <ConversationalInput 
                    value={profile.dreams}
                    onChange={(val) => setProfile({ ...profile, dreams: val })}
                    onSubmit={handleNext}
                    placeholder="I want to be a software engineer, or maybe start my own business..."
                    autoFocus
                />
            </div>
          </div>
        );

      case 5: // Concerns (New Step)
        return (
          <div className="space-y-6">
             {renderBubble("Is there anything worrying you? Any specific questions or fears?", true)}
             <div className="pl-11">
                <ConversationalInput 
                    value={profile.concerns}
                    onChange={(val) => setProfile({ ...profile, concerns: val })}
                    onSubmit={handleNext}
                    placeholder="I'm worried about tuition fees, or if I'm smart enough..."
                    autoFocus
                />
                <div className="mt-2 text-right">
                    <button onClick={handleNext} className="text-xs text-slate-400 hover:text-slate-600">
                        No concerns? Press enter or click here to skip.
                    </button>
                </div>
             </div>
          </div>
        );

      case 6: // Documents
        return (
          <div className="space-y-6">
            {renderBubble("Almost there! Do you have any exam results (WAEC/JAMB), a CV, or notes you want me to look at?", true)}
            
            <div className="pl-11">
               <div 
                 className="border-2 border-dashed border-emerald-200 bg-emerald-50/50 rounded-xl p-8 text-center hover:bg-emerald-50 transition-colors cursor-pointer group" 
                 onClick={() => fileInputRef.current?.click()}
               >
                   <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*,application/pdf"
                    />
                    <div className="flex flex-col items-center gap-3 text-slate-500 group-hover:text-emerald-600 transition-colors">
                        <div className="bg-white p-3 rounded-full shadow-sm">
                             <Paperclip className="w-6 h-6 text-emerald-500" />
                        </div>
                        <span className="text-sm font-medium">Tap to upload files (Optional)</span>
                    </div>
               </div>

                {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                    {files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg text-sm text-slate-700 border border-slate-200 shadow-sm">
                        <span className="truncate max-w-[150px]">{file.name}</span>
                        <button type="button" onClick={() => setFiles(files.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500">
                           <X className="w-3 h-3" />
                        </button>
                    </div>
                    ))}
                </div>
                )}
                
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={submitForm}
                        disabled={isLoading}
                        className={`
                            flex items-center gap-2 px-8 py-3 rounded-full font-bold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95
                            ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:shadow-emerald-500/25'}
                        `}
                    >
                        {isLoading ? "Analyzing..." : "Generate My Plan ✨"}
                    </button>
                </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render previous answers as distinct "user bubbles" to maintain context
  const renderHistory = () => {
    return (
      <div className="space-y-6 opacity-60 hover:opacity-100 transition-opacity duration-300 mb-6">
        {currentStep > 0 && profile.name && (
            <>
                {renderBubble("What should I call you?", true)}
                {renderBubble(profile.name, false)}
            </>
        )}
        {currentStep > 1 && profile.situation && (
             <>
                {renderBubble("Current situation?", true)}
                {renderBubble(profile.situation, false)}
             </>
        )}
        {currentStep > 2 && profile.interests.length > 0 && (
             <>
                {renderBubble("Interests?", true)}
                {renderBubble(profile.interests.join(', '), false)}
             </>
        )}
        {currentStep > 3 && profile.constraints.length > 0 && (
             <>
                {renderBubble("Constraints?", true)}
                {renderBubble(profile.constraints.join(', '), false)}
             </>
        )}
        {currentStep > 4 && profile.dreams && (
             <>
                {renderBubble("Career dreams?", true)}
                {renderBubble(profile.dreams, false)}
             </>
        )}
         {currentStep > 5 && profile.concerns && (
             <>
                {renderBubble("Concerns?", true)}
                {renderBubble(profile.concerns, false)}
             </>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col min-h-[500px]">
      
      {/* Progress Header */}
      <div className="mb-6 px-1">
        <div className="flex justify-between items-end mb-2">
           <button 
             onClick={handleBack} 
             disabled={currentStep === 0 || isLoading}
             className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-slate-400 hover:text-emerald-600 transition-colors ${currentStep === 0 ? 'invisible' : ''}`}
           >
             <ArrowLeft className="w-3 h-3" /> Back
           </button>
           <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">
             Step {currentStep + 1}/{STEPS.length}
           </span>
        </div>
        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Conversation Flow */}
      <div className="flex-1 pb-10">
        {renderHistory()}
        {renderStepContent()}
        <div ref={chatEndRef} className="h-4" />
      </div>

    </div>
  );
};

export default InputForm;