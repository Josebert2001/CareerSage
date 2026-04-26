
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

const STEPS = [
  { id: 'name',        label: 'Intro' },
  { id: 'situation',   label: 'Status' },
  { id: 'interests',   label: 'Interests' },
  { id: 'constraints', label: 'Context' },
  { id: 'dreams',      label: 'Dreams' },
  { id: 'concerns',    label: 'Concerns' },
  { id: 'docs',        label: 'Docs' },
];

const SITUATION_OPTIONS = [
  "Still in secondary school (SS1-SS3)",
  "Preparing for JAMB or WAEC",
  "In university right now",
  "In a polytechnic or college of education",
  "Just finished NYSC",
  "Working but want to switch careers",
];

const INTEREST_OPTIONS = [
  "Mathematics", "Coding/Tech", "Creative Arts", "Business/Sales",
  "Sports", "Writing", "Science/Biology", "Public Speaking",
  "Helping People", "Fixing Things", "Agriculture", "Entertainment",
];

const CONSTRAINT_OPTIONS = [
  "Money is tight right now",
  "Family pressure on my choice",
  "Need to start earning ASAP",
  "Looking for scholarships only",
  "Willing to relocate for work",
  "My parents have a specific plan for me",
];

const InputForm: React.FC<InputFormProps> = ({
  profile,
  setProfile,
  currentStep,
  setCurrentStep,
  onSubmit,
  isLoading,
}) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [currentStep, isTyping]);

  useEffect(() => {
    setIsTyping(true);
    const t = setTimeout(() => setIsTyping(false), 480);
    return () => clearTimeout(t);
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
    else submitForm();
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const fileList = Array.from(e.target.files) as File[];
    const newFiles: FileData[] = [];
    let processed = 0;
    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          newFiles.push({
            name: file.name,
            mimeType: file.type,
            data: (ev.target.result as string).split(',')[1],
          });
        }
        processed++;
        if (processed === fileList.length) setFiles((prev) => [...prev, ...newFiles]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  /* ── Bubble renderer ─────────────────────── */
  const renderBubble = (text: React.ReactNode, isAi = true) => (
    <div className={`flex w-full mb-5 ${isAi ? 'justify-start' : 'justify-end'} animate-fadeIn`}>
      <div className={`flex max-w-[90%] md:max-w-[78%] gap-3 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
        {isAi && (
          <div className="w-8 h-8 rounded-full brand-gradient flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-emerald-600/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        )}
        <div className={`px-5 py-3.5 text-sm leading-relaxed ${
          isAi
            ? 'solid-card text-slate-700 rounded-2xl rounded-tl-none'
            : 'bg-emerald-600 text-white rounded-2xl rounded-tr-none shadow-md shadow-emerald-500/20'
        }`}>
          {text}
        </div>
      </div>
    </div>
  );

  const TypingIndicator = () => (
    <div className="flex w-full mb-5 justify-start animate-fadeIn">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full brand-gradient flex items-center justify-center flex-shrink-0 mt-1 shadow-md opacity-80">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="solid-card px-5 py-3.5 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );

  /* ── Step content ────────────────────────── */
  const renderStepContent = () => {
    if (isTyping) return <TypingIndicator />;

    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-5">
            {renderBubble("Hey. Before anything else — what do I call you?")}
            <div className="pl-11">
              <ConversationalInput
                value={profile.name}
                onChange={(val) => setProfile({ ...profile, name: val })}
                onSubmit={handleNext}
                placeholder="Just my first name is fine..."
                autoFocus
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-5">
            {renderBubble(<>Okay {profile.name}. Where are you right now? Not where you want to be — just where you are today.</>)}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pl-11">
              {SITUATION_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setProfile({ ...profile, situation: opt }); setTimeout(handleNext, 280); }}
                  className={`p-4 rounded-xl text-left border-2 transition-all text-sm font-medium hover:-translate-y-0.5 ${
                    profile.situation === opt
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold shadow-md shadow-emerald-500/10'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{opt}</span>
                    {profile.situation === opt && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            {renderBubble("What do you actually enjoy? Not what looks good on paper — what makes time disappear?")}
            <div className="pl-11">
              <div className="flex flex-wrap gap-2 mb-5">
                {INTEREST_OPTIONS.map((interest) => {
                  const selected = profile.interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      onClick={() => {
                        const next = selected
                          ? profile.interests.filter((i) => i !== interest)
                          : [...profile.interests, interest];
                        setProfile({ ...profile, interests: next });
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all active:scale-95 ${
                        selected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:bg-white hover:shadow-sm'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={profile.interests.length === 0}
                  className={`px-7 py-2.5 rounded-full font-bold text-sm transition-all ${
                    profile.interests.length > 0
                      ? 'brand-gradient text-white shadow-md hover:opacity-90 hover:-translate-y-0.5'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            {renderBubble("Real talk — what's the situation at home? Money? Family pressure? I need to know so I don't give you advice that ignores your reality.")}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pl-11">
              {CONSTRAINT_OPTIONS.map((opt) => {
                const selected = profile.constraints.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => {
                      const next = selected
                        ? profile.constraints.filter((i) => i !== opt)
                        : [...profile.constraints, opt];
                      setProfile({ ...profile, constraints: next });
                    }}
                    className={`p-4 rounded-xl text-left border transition-all text-sm ${
                      selected
                        ? 'border-amber-400 bg-amber-50 text-amber-900 shadow-md shadow-amber-400/10'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-amber-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                        selected ? 'bg-amber-400 border-amber-400' : 'border-slate-300 bg-white'
                      }`}>
                        {selected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className="font-medium">{opt}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="pl-11 flex justify-end items-center gap-4">
              {profile.constraints.length === 0 && (
                <button
                  onClick={handleNext}
                  className="text-sm font-semibold text-slate-400 hover:text-emerald-600 underline decoration-slate-300 underline-offset-4 transition-colors"
                >
                  None apply
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-full font-bold text-sm brand-gradient text-white shadow-md hover:opacity-90 transition-all"
              >
                {profile.constraints.length > 0 ? 'Continue' : 'Skip'}
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            {renderBubble("Now dream a little. If money and family weren't a problem — what would you be doing in 5 years?")}
            <div className="pl-11">
              <ConversationalInput
                value={profile.dreams}
                onChange={(val) => setProfile({ ...profile, dreams: val })}
                onSubmit={handleNext}
                placeholder="Even if it sounds impossible, say it..."
                autoFocus
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-5">
            {renderBubble("Last thing. What's the fear? The thing that keeps you up at night about all of this.")}
            <div className="pl-11">
              <ConversationalInput
                value={profile.concerns}
                onChange={(val) => setProfile({ ...profile, concerns: val })}
                onSubmit={handleNext}
                placeholder="I'm worried that..."
                autoFocus
              />
              <div className="mt-2 text-right">
                <button
                  onClick={handleNext}
                  className="text-xs font-semibold text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  I don't have a specific fear right now
                </button>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-5">
            {renderBubble("Almost done. Do you have WAEC results, a JAMB score, or a CV? Drop them here and I'll factor them in.")}
            <div className="pl-11">
              <div
                className="border-2 border-dashed border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/40 rounded-2xl p-8 text-center transition-all cursor-pointer group"
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
                <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-emerald-600 transition-colors">
                  <div className="bg-white border border-slate-100 p-3.5 rounded-full shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
                    <Paperclip className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold">Add your documents</span>
                  <span className="text-xs text-slate-400">PDF or image, optional</span>
                </div>
              </div>

              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg text-sm text-slate-700 border border-slate-200 shadow-sm">
                      <span className="truncate max-w-[140px] font-medium">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 flex justify-end gap-4 items-center">
                <button
                  onClick={submitForm}
                  className="text-sm font-semibold text-slate-400 hover:text-emerald-600 transition-colors"
                >
                  Skip — I don't have any right now
                </button>
                <button
                  onClick={submitForm}
                  disabled={isLoading}
                  className={`flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-white shadow-xl transition-all active:scale-95 ${
                    isLoading ? 'bg-slate-400 cursor-not-allowed' : 'brand-gradient hover:opacity-90 hover:-translate-y-0.5'
                  }`}
                >
                  {isLoading ? 'Analyzing…' : 'Generate My Plan ✨'}
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  /* ── Chat history ───────────────────────── */
  const renderHistory = () => (
    <div className="space-y-5 opacity-50 hover:opacity-100 transition-opacity duration-300 mb-5">
      {currentStep > 0 && profile.name && (
        <>
          {renderBubble("Hey. Before anything else — what do I call you?")}
          {renderBubble(profile.name, false)}
        </>
      )}
      {currentStep > 1 && profile.situation && (
        <>
          {renderBubble(<>Okay {profile.name}. Where are you right now?</>)}
          {renderBubble(profile.situation, false)}
        </>
      )}
      {currentStep > 2 && profile.interests.length > 0 && (
        <>
          {renderBubble("What do you actually enjoy?")}
          {renderBubble(profile.interests.join(', '), false)}
        </>
      )}
      {currentStep > 3 && profile.constraints.length > 0 && (
        <>
          {renderBubble("Real talk — what's the situation at home?")}
          {renderBubble(profile.constraints.join(', '), false)}
        </>
      )}
      {currentStep > 4 && profile.dreams && (
        <>
          {renderBubble("If money and family weren't a problem — what would you be doing in 5 years?")}
          {renderBubble(profile.dreams, false)}
        </>
      )}
      {currentStep > 5 && profile.concerns && (
        <>
          {renderBubble("What's the fear that keeps you up at night?")}
          {renderBubble(profile.concerns, false)}
        </>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col min-h-[500px]">

      {/* Progress header */}
      <div className="mb-8 px-1">
        <div className="flex justify-between items-center mb-3">
          <button
            onClick={handleBack}
            disabled={currentStep === 0 || isLoading}
            className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
              currentStep === 0 ? 'invisible' : 'text-slate-400 hover:text-emerald-600'
            }`}
          >
            <ArrowLeft className="w-3 h-3" /> Back
          </button>

          {/* Step pills */}
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={`transition-all duration-300 rounded-full ${
                  i < currentStep
                    ? 'w-2 h-2 bg-emerald-500'
                    : i === currentStep
                      ? 'w-6 h-2 bg-emerald-600'
                      : 'w-2 h-2 bg-slate-200'
                }`}
              />
            ))}
          </div>

          <span className="text-xs font-extrabold text-emerald-700 tabular-nums">
            {currentStep + 1}/{STEPS.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${((currentStep + 1) / STEPS.length) * 100}%`,
              background: 'linear-gradient(90deg, #059669, #34d399)',
              boxShadow: '0 0 8px rgba(16,185,129,0.4)',
            }}
          />
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 pb-10">
        {renderHistory()}
        {renderStepContent()}
        <div ref={chatEndRef} className="h-4" />
      </div>
    </div>
  );
};

export default InputForm;
