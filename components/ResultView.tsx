
import React, { useState, useEffect } from 'react';
import { CareerAdviceResponse, Pathway, FutureVision } from '../types';
import { BookOpen, Briefcase, CheckCircle, AlertTriangle, TrendingUp, Clock, Target, ArrowRight, ChevronDown, ExternalLink, ThumbsUp, ThumbsDown, Sparkles, Gamepad2, Camera, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { generateFutureVision } from '../services/geminiService';

interface ResultViewProps {
  data: CareerAdviceResponse;
  onReset: () => void;
  onSimulate: (pathway: Pathway) => void;
}

// Progressive Reveal Helper
const Reveal: React.FC<{ delay: number; children: React.ReactNode }> = ({ delay, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!isVisible) return null;
  return <div className="animate-fadeIn">{children}</div>;
};

interface AccordionItemProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  iconColor?: string;
  defaultOpen?: boolean;
  className?: string;
}

const safeArray = <T,>(arr: T[] | undefined | null): T[] => Array.isArray(arr) ? arr : [];

const AccordionItem: React.FC<AccordionItemProps> = ({ 
  title, icon: Icon, children, iconColor = "text-slate-500", defaultOpen = false, className = ""
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className={`border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm transition-all duration-200 ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
        type="button"
      >
        <div className="flex items-center gap-3 font-semibold text-slate-800">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          {title}
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="p-5 border-t border-slate-100 animate-fadeIn">{children}</div>}
    </div>
  );
};

const SalaryChart: React.FC<{ min: number; max: number; currency: string }> = ({ min, max, currency }) => {
    if (!min || !max || min === 0 || max === 0) return null;
    const data = [{ name: 'Entry', amount: min }, { name: 'Senior', amount: max }];
    return (
      <div className="h-48 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
            <YAxis hide />
            <Tooltip cursor={{fill: '#f1f5f9'}} formatter={(value: number) => [`${currency} ${value.toLocaleString()}`, 'Salary']} />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]} barSize={40}>
              <Cell fill="#34d399" />
              <Cell fill="#059669" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
};
  
const DemandGauge: React.FC<{ score: number }> = ({ score }) => {
    if (score === undefined || score === 0) return null;
    const color = score > 75 ? "bg-emerald-500" : score > 40 ? "bg-amber-500" : "bg-red-500";
    const text = score > 75 ? "High Demand" : score > 40 ? "Moderate" : "Low Demand";
    return (
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs font-medium text-slate-500 uppercase"><span>Saturation</span><span>High Growth</span></div>
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${score}%` }} />
        </div>
        <div className="flex justify-end"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color} bg-opacity-10 text-slate-700`}>{text} ({score}/100)</span></div>
      </div>
    );
};

const ActionStepCheckbox: React.FC<{ step: string; id: string }> = ({ step, id }) => {
    const [checked, setChecked] = useState(() => localStorage.getItem(id) === 'true');
    const toggle = () => { const newState = !checked; setChecked(newState); localStorage.setItem(id, String(newState)); };
    return (
      <li className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer" onClick={toggle}>
        <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'}`}>
          {checked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
        </div>
        <span className={`text-sm leading-relaxed transition-all ${checked ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{step}</span>
      </li>
    );
};

// --- NEW COMPONENT: Future Self Polaroid ---
const FutureSelfPolaroid: React.FC<{ pathwayTitle: string; userContext: string }> = ({ pathwayTitle, userContext }) => {
  const [vision, setVision] = useState<FutureVision | null>(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateFutureVision(pathwayTitle, userContext);
      setVision(result);
      setGenerated(true);
    } catch (e) {
      console.error(e);
      alert("Could not generate image right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (generated && vision) {
    return (
      <div className="mt-6 animate-fadeIn">
        <div className="bg-white p-3 pb-8 rounded shadow-xl rotate-1 transform transition-all hover:rotate-0 border border-slate-100 max-w-sm mx-auto">
           <div className="aspect-square bg-slate-100 overflow-hidden mb-4 relative rounded-sm">
              <img src={`data:image/png;base64,${vision.imageData}`} alt="Future Self" className="w-full h-full object-cover" />
           </div>
           <p className="text-center font-handwriting text-slate-600 text-lg leading-tight px-2" style={{fontFamily: 'cursive'}}>
             {vision.caption}
           </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 border-2 border-dashed border-purple-200 rounded-xl p-6 bg-purple-50/50 flex flex-col items-center text-center">
       <div className="bg-white p-3 rounded-full mb-3 shadow-sm">
          <Camera className="w-6 h-6 text-purple-500" />
       </div>
       <h4 className="font-bold text-purple-900 mb-1">Visualize Your Future</h4>
       <p className="text-xs text-purple-700 mb-4 max-w-xs">See a snapshot of yourself in this role using AI image generation.</p>
       
       <button 
         onClick={handleGenerate}
         disabled={loading}
         className="px-5 py-2 bg-purple-600 text-white text-sm font-semibold rounded-full hover:bg-purple-700 transition-colors shadow-md flex items-center gap-2"
       >
         {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
         {loading ? "Developing Photo..." : "Generate Snapshot"}
       </button>
    </div>
  );
};

const ResultView: React.FC<ResultViewProps> = ({ data, onReset, onSimulate }) => {
  if (!data) return null;
  
  const [activeTab, setActiveTab] = useState<'practical' | 'growth'>('practical');
  const [feedbackState, setFeedbackState] = useState<'none' | 'helpful' | 'not-helpful'>('none');

  const renderBubble = (text: React.ReactNode, delay: number = 0) => (
    <Reveal delay={delay}>
        <div className="flex w-full mb-4 justify-start">
            <div className="flex max-w-[90%] gap-3 flex-row">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1 border border-emerald-200">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="p-4 bg-white text-slate-700 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm text-sm md:text-base leading-relaxed">
                    {text}
                </div>
            </div>
        </div>
    </Reveal>
  );

  const renderPathway = (pathway: Pathway, type: 'practical' | 'growth') => (
    <div className="animate-fadeIn space-y-6">
      {/* Header Section */}
      <div className={`p-6 rounded-2xl ${type === 'practical' ? 'bg-blue-50 border border-blue-100' : 'bg-purple-50 border border-purple-100'}`}>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${type === 'practical' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                {type === 'practical' ? 'Option A: Practical' : 'Option B: Growth'}
              </span>
            </div>
            <h3 className={`text-2xl md:text-3xl font-bold ${type === 'practical' ? 'text-blue-900' : 'text-purple-900'}`}>
              {pathway.title}
            </h3>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap md:flex-nowrap">
            <button 
                onClick={() => onSimulate(pathway)}
                className="flex items-center gap-2 bg-white text-slate-800 px-4 py-2 rounded-lg font-semibold shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-300 hover:text-emerald-700 transition-all group"
            >
                <Gamepad2 className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span>Simulate</span>
            </button>
          </div>
        </div>

        <p className="text-slate-700 leading-relaxed mb-6 bg-white/60 p-4 rounded-xl backdrop-blur-sm">
          {pathway.fitReason}
        </p>

        {/* Future Vision Polaroid */}
        <FutureSelfPolaroid 
            pathwayTitle={pathway.title} 
            userContext={`${data.studentProfile.summary} Location: Nigeria/Africa.`} 
        />

        {(pathway.demandScore > 0 || (pathway.salaryRange && pathway.salaryRange.max > 0)) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 mb-2">
            {pathway.demandScore > 0 && (
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-slate-500 font-medium"><TrendingUp className="w-4 h-4" /><span>Market Reality</span></div>
                <DemandGauge score={pathway.demandScore} />
                <p className="text-xs text-slate-400 mt-3">{pathway.marketReality}</p>
              </div>
            )}
            {pathway.salaryRange && pathway.salaryRange.max > 0 && (
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-1 text-slate-500 font-medium"><div className="text-sm">Est. Monthly Income</div></div>
                <div className="flex items-baseline gap-1"><span className="text-2xl font-bold text-slate-800">{pathway.salaryRange.currency} {pathway.salaryRange.max.toLocaleString()}</span><span className="text-xs text-slate-400">/mo (Senior)</span></div>
                <SalaryChart min={pathway.salaryRange.min} max={pathway.salaryRange.max} currency={pathway.salaryRange.currency} />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm ring-1 ring-emerald-50">
        <h4 className="flex items-center gap-2 font-semibold text-emerald-900 mb-4"><CheckCircle className="w-5 h-5 text-emerald-600" />Start This Week</h4>
        <ul className="space-y-1">
          {safeArray(pathway.actionSteps).map((step, i) => (
             <ActionStepCheckbox key={i} step={step} id={`step-${type}-${i}-${pathway.title.substring(0,5)}`} />
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <AccordionItem title="Required Skills" icon={Target} iconColor="text-emerald-600">
          <div className="space-y-4">
            <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Technical</p><div className="flex flex-wrap gap-2">{safeArray(pathway.requiredSkills?.technical).map((skill, i) => (<span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 text-sm rounded-md border border-slate-200">{skill}</span>))}</div></div>
            <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Soft Skills</p><div className="flex flex-wrap gap-2">{safeArray(pathway.requiredSkills?.soft).map((skill, i) => (<span key={i} className="px-2 py-1 bg-amber-50 text-amber-800 text-sm rounded-md border border-amber-100">{skill}</span>))}</div></div>
          </div>
        </AccordionItem>
        <AccordionItem title="Education & Timeline" icon={BookOpen} iconColor="text-blue-600">
          <div className="mb-4 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg"><Clock className="w-4 h-4" /><span>Expected Timeline: <strong>{pathway.timeline}</strong></span></div>
          <ul className="space-y-3">{safeArray(pathway.educationOptions).map((opt, i) => (<li key={i} className="flex items-start gap-3 text-sm text-slate-700"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" /><span className="leading-relaxed">{opt}</span></li>))}</ul>
        </AccordionItem>
        <AccordionItem title="Challenges & Risks" icon={AlertTriangle} iconColor="text-amber-500">
          <ul className="space-y-3">{safeArray(pathway.challenges).map((challenge, i) => (<li key={i} className="flex items-start gap-3 text-sm text-slate-700"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" /><span className="leading-relaxed">{challenge}</span></li>))}</ul>
        </AccordionItem>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto pb-20 pt-4">
      {/* 1. Profile Summary - Delayed */}
      {renderBubble(
        <>
            <p className="font-semibold mb-2 text-emerald-800">Okay, I've analyzed your profile.</p>
            <p>{data.studentProfile.summary}</p>
        </>, 
        0
      )}

      <Reveal delay={1500}>
         <div className="bg-slate-50 rounded-xl p-4 mb-6 border-l-4 border-emerald-400 text-slate-600 text-sm italic">
            "{data.reflection}"
         </div>
      </Reveal>

      {/* 2. Intro to Pathways */}
      {renderBubble("Based on what you told me, I have TWO pathways for you. Let's look at what you can do right now versus your long-term dream.", 3000)}

      {/* 3. The Pathways UI */}
      <Reveal delay={4500}>
        <div className="mb-8">
            <div className="flex justify-center p-1 bg-slate-200 rounded-xl mb-6 max-w-md mx-auto">
            <button onClick={() => setActiveTab('practical')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'practical' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                <Briefcase className="w-4 h-4" /> Practical
            </button>
            <button onClick={() => setActiveTab('growth')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'growth' ? 'bg-white text-purple-900 shadow-sm' : 'text-slate-600 hover:text-purple-900'}`}>
                <TrendingUp className="w-4 h-4" /> Growth
            </button>
            </div>

            {activeTab === 'practical' ? renderPathway(data.practicalPathway, 'practical') : renderPathway(data.growthPathway, 'growth')}
        </div>
      </Reveal>

      {/* 4. Sources */}
      {data.sources && data.sources.length > 0 && (
        <Reveal delay={5000}>
            <div className="max-w-4xl mx-auto mb-8">
            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Sources & References</h4>
            <div className="flex flex-wrap gap-3">
                {data.sources.map((source, i) => (
                <a key={i} href={source.uri} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors">
                    <span className="truncate max-w-[150px]">{source.title}</span><ExternalLink className="w-3 h-3" />
                </a>
                ))}
            </div>
            </div>
        </Reveal>
      )}

      {/* 5. Closing */}
      <Reveal delay={6000}>
        <div className="bg-emerald-900 text-white rounded-2xl p-8 text-center relative overflow-hidden space-y-8">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
            <div className="relative z-10 border-b border-emerald-800 pb-6">
                <h4 className="text-sm font-medium text-emerald-300 mb-3 uppercase tracking-wider">Was this helpful?</h4>
                <div className="flex justify-center gap-4">
                    <button onClick={() => setFeedbackState('helpful')} className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${feedbackState === 'helpful' ? 'bg-white text-emerald-900 border-white' : 'border-emerald-700 text-emerald-100 hover:bg-emerald-800'}`}><ThumbsUp className="w-4 h-4" /> Yes</button>
                    <button onClick={() => setFeedbackState('not-helpful')} className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${feedbackState === 'not-helpful' ? 'bg-white text-emerald-900 border-white' : 'border-emerald-700 text-emerald-100 hover:bg-emerald-800'}`}><ThumbsDown className="w-4 h-4" /> No</button>
                </div>
            </div>
            <div className="relative z-10">
            <h3 className="text-xl font-bold mb-3">Keep Exploring</h3>
            <p className="text-emerald-100 mb-6 max-w-2xl mx-auto">{data.closingMessage}</p>
            <button onClick={onReset} className="inline-flex items-center gap-2 px-6 py-2 bg-white text-emerald-900 rounded-full font-semibold hover:bg-emerald-50 transition-colors shadow-lg">Start New Session <ArrowRight className="w-4 h-4" /></button>
            </div>
        </div>
      </Reveal>
    </div>
  );
};

export default ResultView;
