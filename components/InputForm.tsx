
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
  "Still in secondary school (SS1-SS3)",
  "Preparing for JAMB or WAEC",
  "In university right now",
  "In a polytechnic or college of education",
  "Just finished NYSC",
  "Working but want to switch careers"
];

const INTEREST_OPTIONS = [
  "Mathematics", "Coding/Tech", "Creative Arts", "Business/Sales", 
  "Sports", "Writing", "Science/Biology", "Public Speaking", 
  "Helping People", "Fixing Things", "Agriculture", "Entertainment"
];

const CONSTRAINT_OPTIONS = [
  "Money is tight right now",
  "Family pressure on my choice",
  "Need to start earning ASAP",
  "Looking for scholarships only",
  "Willing to relocate for work",
  "My parents have a specific plan for me"
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

  // Optimized auto-scroll
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentStep, isTyping]);

  // Simulate AI typing effect when entering a new step
  useEffect(() => {
    setIsTyping(true);
    const timer = setTimeout(() => setIsTyping(false), 500); // slightly faster
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
      <div className={`flex max-w-[90%] md:max-w-[80%] gap-3 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
        {isAi && (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        )}
        <div className={`p-5 text-sm md:text-base leading-relaxed shadow-sm transition-all hover:shadow-md ${
          isAi 
            ? 'glass-card text-slate-700 rounded-2xl rounded-tl-none border-white/60' 
            : 'bg-emerald-600 text-white rounded-2xl rounded-tr-none shadow-emerald-500/20'
        }`}>
          {text}
        </div>
      </div>
    </div>
  );

  const TypingIndicator = () => (
    <div className="flex w-full mb-6 justify-start animate-fadeIn">
       <div className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 mt-1 shadow-md opacity-80">
             <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="glass-card px-5 py-4 rounded-2xl rounded-tl-none border border-white/60 shadow-sm flex gap-1.5 items-center h-[56px]">
             <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
             <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
             <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
       </div>
    </div>
  );

  const renderStepContent = () => {
    if (isTyping) return <TypingIndicator />;

    switch (currentStep) {
      case 0: // Name
        return (
          <div className="space-y-6" role="region" aria-label="Name input step">
            {renderBubble("Hey. Before anything else — what do I call you?")}
            <div className="pl-12">
              <label htmlFor="name-input" className="sr-only">Enter your first name</label>
              <ConversationalInput 
                id="name-input"
                value={profile.name}
                onChange={(val) => setProfile({ ...profile, name: val })}
                onSubmit={handleNext}
                placeholder="Just my first name is fine..."
                autoFocus
                aria-label="Your first name"
              />
            </div>
          </div>
        );

      case 1: // Situation
        return (
          <div className="space-y-6" role="region" aria-label="Current situation selection">
             {renderBubble(<>Okay {profile.name}. Where are you right now? Not where you want to be — just where you are today.</>, true)}
             <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12 border-0 p-0 m-0">
               <legend className="sr-only">Select your current situation</legend>
               {SITUATION_OPTIONS.map((opt) => (
                 <button
                   key={opt}
                   role="radio"
                   aria-checked={profile.situation === opt}
                   onClick={() => {
                     setProfile({ ...profile, situation: opt });
                     setTimeout(handleNext, 300);
                   }}
                   className={`p-4 md:p-5 rounded-xl text-left border-2 transition-all hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 min-h-[56px] ${
                     profile.situation === opt 
                       ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 font-bold shadow-md' 
                       : 'border-white bg-white/60 text-slate-600 hover:border-emerald-300 hover:shadow-md'
                   }`}
                 >
                   <div className="flex items-center justify-between gap-3">
                     <span className="font-medium">{opt}</span>
                     {profile.situation === opt && <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" aria-hidden="true" />}
                   </div>
                 </button>
               ))}
             </fieldset>
          </div>
        );

      case 2: // Interests
        return (
          <div className="space-y-6" role="region" aria-label="Interest selection">
            {renderBubble("What do you actually enjoy? Not what looks good on paper — what makes time disappear?", true)}
            <div className="pl-12">
                <fieldset className="border-0 p-0 m-0">
                  <legend className="sr-only">Select your interests (at least one required)</legend>
                  <div className="flex flex-wrap gap-2 md:gap-3 mb-6">
                    {INTEREST_OPTIONS.map((interest) => {
                        const isSelected = profile.interests.includes(interest);
                        return (
                        <button
                            key={interest}
                            role="checkbox"
                            aria-checked={isSelected}
                            onClick={() => {
                            const newInterests = isSelected
                                ? profile.interests.filter(i => i !== interest)
                                : [...profile.interests, interest];
                            setProfile({ ...profile, interests: newInterests });
                            }}
                            className={`px-4 md:px-5 py-2 md:py-2.5 rounded-full text-sm font-semibold border transition-all transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 min-h-[44px] ${
                            isSelected
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20'
                                : 'bg-white/80 text-slate-600 border-white hover:border-emerald-300 hover:bg-white hover:shadow-md'
                            }`}
                        >
                            {interest}
                        </button>
                        );
                    })}
                  </div>
                </fieldset>
                
                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
                    {profile.interests.length === 0 && (
                      <p className="text-sm text-slate-500 text-center sm:text-right">Select at least one interest to continue</p>
                    )}
                    <button 
                        onClick={handleNext} 
                        disabled={profile.interests.length === 0}
                        className={`px-8 py-3 rounded-full font-bold transition-all shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 min-h-[44px] ${
                            profile.interests.length > 0 ? 'bg-slate-900 text-white hover:bg-slate-800 hover:-translate-y-0.5' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                        aria-disabled={profile.interests.length === 0}
                    >
                        Continue
                    </button>
                </div>
            </div>
          </div>
        );

      case 3: // Constraints
        return (
          <div className="space-y-6" role="region" aria-label="Constraints and context selection">
             {renderBubble("Real talk — what's the situation at home? Money? Family pressure? I need to know so I don't give you advice that ignores your reality.", true)}
             <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 pl-12 border-0 p-0 m-0">
               <legend className="sr-only">Select any constraints or context that apply to you</legend>
               {CONSTRAINT_OPTIONS.map((opt) => {
                 const isSelected = profile.constraints.includes(opt);
                 return (
                    <button
                        key={opt}
                        role="checkbox"
                        aria-checked={isSelected}
                        onClick={() => {
                        const newConstraints = isSelected
                            ? profile.constraints.filter(i => i !== opt)
                            : [...profile.constraints, opt];
                        setProfile({ ...profile, constraints: newConstraints });
                        }}
                        className={`p-4 md:p-5 rounded-xl text-left border transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 min-h-[56px] ${
                        isSelected 
                            ? 'border-orange-400 bg-orange-50/80 text-orange-900 shadow-md' 
                            : 'border-white bg-white/60 text-slate-600 hover:border-orange-200 hover:bg-white hover:shadow-sm'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 md:w-6 md:h-6 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${isSelected ? 'bg-orange-400 border-orange-400' : 'border-slate-300 bg-white'}`}>
                                {isSelected && <Check className="w-4 h-4 md:w-5 md:h-5 text-white" aria-hidden="true" />}
                            </div>
                            <span className="font-medium">{opt}</span>
                        </div>
                    </button>
                  );
               })}
             </fieldset>
             <div className="pl-12 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end mt-8">
                <button 
                  onClick={handleNext} 
                  className="px-6 py-3 text-sm font-semibold text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                    Skip / None apply
                </button>
                {profile.constraints.length > 0 && (
                     <button 
                     onClick={handleNext} 
                     className="px-8 py-3 rounded-full font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-all hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800"
                    >
                     Continue
                    </button>
                )}
             </div>
          </div>
        );

      case 4: // Dreams
        return (
          <div className="space-y-6" role="region" aria-label="Dreams and goals input">
            {renderBubble("Now dream a little. If money and family weren't a problem — what would you be doing in 5 years?", true)}
            <div className="pl-12">
                <label htmlFor="dreams-input" className="sr-only">Describe your dreams and goals</label>
                <ConversationalInput 
                    id="dreams-input"
                    value={profile.dreams}
                    onChange={(val) => setProfile({ ...profile, dreams: val })}
                    onSubmit={handleNext}
                    placeholder="Even if it sounds impossible, say it..."
                    autoFocus
                    aria-label="Your dreams for the next 5 years"
                />
            </div>
          </div>
        );

      case 5: // Concerns
        return (
          <div className="space-y-6" role="region" aria-label="Concerns and fears input">
             {renderBubble("Last thing. What's the fear? The thing that keeps you up at night about all of this.", true)}
             <div className="pl-12">
                <label htmlFor="concerns-input" className="sr-only">Describe your concerns and fears</label>
                <ConversationalInput 
                    id="concerns-input"
                    value={profile.concerns}
                    onChange={(val) => setProfile({ ...profile, concerns: val })}
                    onSubmit={handleNext}
                    placeholder="I'm worried that..."
                    autoFocus
                    aria-label="Your concerns or fears about your career"
                />
                <div className="mt-4 text-center">
                    <button 
                      onClick={handleNext} 
                      className="text-sm font-semibold text-slate-500 hover:text-emerald-700 hover:underline transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                    >
                        I don't have a specific fear right now
                    </button>
                </div>
             </div>
          </div>
        );

      case 6: // Documents
        return (
          <div className="space-y-6" role="region" aria-label="Document upload">
            {renderBubble("Almost done. Do you have WAEC results, a JAMB score, or a CV? Drop them here and I'll factor them in.", true)}
            
            <div className="pl-12">
               <div 
                 className="border-2 border-dashed border-emerald-200 bg-white/40 rounded-2xl p-6 md:p-8 text-center hover:bg-emerald-50/50 hover:border-emerald-300 transition-all cursor-pointer group focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2" 
                 onClick={() => fileInputRef.current?.click()}
                 role="button"
                 tabIndex={0}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' || e.key === ' ') {
                     e.preventDefault();
                     fileInputRef.current?.click();
                   }
                 }}
               >
                   <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*,application/pdf"
                        aria-label="Upload documents (WAEC results, JAMB score, CV)"
                    />
                    <div className="flex flex-col items-center gap-3 text-slate-500 group-hover:text-emerald-600 transition-colors">
                        <div className="bg-white p-3 md:p-4 rounded-full shadow-md group-hover:scale-110 transition-transform">
                             <Paperclip className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" aria-hidden="true" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm md:text-base font-semibold">Add your documents (optional)</span>
                          <span className="text-xs text-slate-400">PDF, images up to 10MB each</span>
                        </div>
                    </div>
               </div>

                {files.length > 0 && (
                <div className="space-y-2 mt-6" role="list" aria-label="Uploaded files">
                    <p className="text-sm font-medium text-slate-600">Uploaded files:</p>
                    <div className="flex flex-wrap gap-2">
                      {files.map((file, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg text-sm text-slate-700 border border-slate-200 shadow-sm hover:shadow-md transition-all"
                          role="listitem"
                        >
                            <span className="truncate max-w-[140px] md:max-w-[200px] font-medium">{file.name}</span>
                            <button 
                              type="button" 
                              onClick={() => setFiles(files.filter((_, i) => i !== idx))} 
                              className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-all focus-visible:outline-2 focus-visible:outline-red-500"
                              aria-label={`Remove file ${file.name}`}
                            >
                               <X className="w-4 h-4" />
                            </button>
                        </div>
                      ))}
                    </div>
                </div>
                )}
                
                <div className="mt-8 md:mt-10 flex flex-col sm:flex-row justify-end gap-3 md:gap-4 items-stretch sm:items-center">
                    <button 
                      onClick={submitForm} 
                      className="px-6 py-3 text-sm font-semibold text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                    >
                        Skip — I don't have any right now
                    </button>
                    <button
                        onClick={submitForm}
                        disabled={isLoading}
                        className={`
                            flex items-center justify-center gap-2 px-6 md:px-8 py-3 md:py-3.5 rounded-full font-bold text-white shadow-lg transition-all transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 min-h-[44px] md:min-h-auto text-base
                            ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-900 hover:bg-emerald-800 hover:-translate-y-0.5 active:scale-95'}
                        `}
                        aria-busy={isLoading}
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
    <div className="w-full max-w-3xl mx-auto flex flex-col min-h-[500px]">
      
      {/* Progress Header */}
      <div className="mb-8 px-2">
        <div className="flex justify-between items-end mb-2">
           <button 
             onClick={handleBack} 
             disabled={currentStep === 0 || isLoading}
             className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-emerald-600 transition-colors ${currentStep === 0 ? 'invisible' : ''}`}
           >
             <ArrowLeft className="w-3 h-3" /> Back
           </button>
           <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-widest bg-white/50 px-2 py-0.5 rounded-md">
             Step {currentStep + 1}/{STEPS.length}
           </span>
        </div>
        <div className="h-1.5 w-full bg-slate-200/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
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
