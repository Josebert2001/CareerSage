
import React, { useState, useEffect } from 'react';
import { CareerAdviceResponse, Pathway, FutureVision } from '../types';
import { BookOpen, Briefcase, CheckCircle, AlertTriangle, TrendingUp, Clock, Target, ArrowRight, ChevronDown, ExternalLink, Sparkles, Gamepad2, Camera, Loader2 } from 'lucide-react';
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
    <div className={`border border-white/60 rounded-xl bg-white/50 backdrop-blur-sm overflow-hidden shadow-sm transition-all duration-200 ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/60 transition-colors cursor-pointer"
        type="button"
      >
        <div className="flex items-center gap-3 font-semibold text-slate-800">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          {title}
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && <div className="p-5 border-t border-slate-100/50 animate-fadeIn bg-white/40">{children}</div>}
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
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} />
            <YAxis hide />
            <Tooltip 
                cursor={{fill: '#f1f5f9'}} 
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                formatter={(value: number) => [`${currency} ${value.toLocaleString()}`, 'Salary']} 
            />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={40}>
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
        <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wide"><span>Few Jobs</span><span>Many Jobs</span></div>
        <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
          <div className={`h-full ${color} transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)]`} style={{ width: `${score}%` }} />
        </div>
        <div className="flex justify-end"><span className={`text-xs font-bold px-2 py-1 rounded-full ${color} bg-opacity-10 text-slate-700`}>{text} ({score}/100)</span></div>
      </div>
    );
};

const ActionStepCheckbox: React.FC<{ step: string; id: string }> = ({ step, id }) => {
    const [checked, setChecked] = useState(() => localStorage.getItem(id) === 'true');
    const toggle = () => { const newState = !checked; setChecked(newState); localStorage.setItem(id, String(newState)); };
    return (
      <li className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/50 transition-colors cursor-pointer group" onClick={toggle}>
        <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-300 ${checked ? 'bg-emerald-500 border-emerald-500 shadow-sm' : 'border-slate-300 bg-white group-hover:border-emerald-400'}`}>
          {checked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
        </div>
        <span className={`text-sm leading-relaxed transition-all font-medium ${checked ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{step}</span>
      </li>
    );
};

// --- NEW COMPONENT: Future Self Polaroid ---
const FutureSelfPolaroid: React.FC<{ pathwayTitle: string; userContext: string }> = ({ pathwayTitle, userContext }) => {
  const [vision, setVision] = useState<FutureVision | null>(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateFutureVision(pathwayTitle, userContext);
      setVision(result);
      setGenerated(true);
    } catch (e) {
      console.error(e);
      setError("Could not generate image right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (generated && vision) {
    return (
      <div className="mt-8 animate-fadeIn">
        <div className="bg-white p-4 pb-12 rounded-sm shadow-xl rotate-1 transform transition-all hover:rotate-0 border border-slate-200 max-w-sm mx-auto">
           <div className="aspect-square bg-slate-100 overflow-hidden mb-4 relative rounded-sm shadow-inner">
              <img src={`data:image/png;base64,${vision.imageData}`} alt={`Visualization of you working as a ${pathwayTitle}`} className="w-full h-full object-cover" />
           </div>
           <p className="text-center font-handwriting text-slate-700 text-lg leading-tight px-2" style={{fontFamily: 'cursive'}}>
             {vision.caption}
           </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 border-2 border-dashed border-purple-200 rounded-2xl p-8 bg-purple-50/40 flex flex-col items-center text-center backdrop-blur-sm">
       <div className="bg-white p-3 rounded-full mb-3 shadow-md shadow-purple-500/10">
          <Camera className="w-6 h-6 text-purple-500" />
       </div>
       <h4 className="font-bold text-purple-900 mb-1 text-lg">Visualize Your Future</h4>
       <p className="text-sm text-purple-700/80 mb-5 max-w-xs">See a snapshot of yourself in this role using AI.</p>

       <button
         onClick={handleGenerate}
         disabled={loading}
         className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold rounded-full hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center gap-2 transform active:scale-95 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
       >
         {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
         {loading ? "Developing Photo..." : "Generate Snapshot"}
       </button>

       {error && (
         <div role="alert" className="mt-4 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 max-w-xs">
           {error}
         </div>
       )}
    </div>
  );
};

const ResultView: React.FC<ResultViewProps> = ({ data, onReset, onSimulate }) => {
  if (!data) return null;
  
  const [activeTab, setActiveTab] = useState<'practical' | 'growth'>('practical');

  const renderPathway = (pathway: Pathway, type: 'practical' | 'growth') => (
    <div className="animate-fadeIn space-y-6">
      {/* Header Section */}
      <div className={`p-8 rounded-3xl ${type === 'practical' ? 'bg-gradient-to-br from-emerald-50 to-white border border-emerald-100' : 'bg-gradient-to-br from-orange-50 to-white border border-orange-100'} shadow-lg shadow-slate-200/50`}>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm ${type === 'practical' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                {type === 'practical' ? 'Option A: Right Now' : 'Option B: The 5-Year Vision'}
              </span>
            </div>
            <h3 className={`text-3xl md:text-4xl font-black ${type === 'practical' ? 'text-emerald-900' : 'text-orange-900'} tracking-tight`}>
              {pathway.title}
            </h3>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap md:flex-nowrap">
            <button 
                onClick={() => onSimulate(pathway)}
                className="flex items-center gap-2 bg-white text-slate-800 px-6 py-3 rounded-full font-bold shadow-sm border border-slate-200 hover:shadow-xl hover:border-emerald-300 hover:text-emerald-900 transition-all group active:scale-95"
            >
                <Gamepad2 className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span>Step into this life</span>
            </button>
          </div>
        </div>

        <p className="text-slate-700 text-lg leading-relaxed mb-8 bg-white/60 p-6 rounded-2xl backdrop-blur-sm border border-white/80">
          {pathway.fitReason}
        </p>

        {/* Future Vision Polaroid */}
        <FutureSelfPolaroid 
            pathwayTitle={pathway.title} 
            userContext={`${data.studentProfile.summary} Location: Nigeria/Africa.`} 
        />

        {(pathway.demandScore > 0 || (pathway.salaryRange && pathway.salaryRange.max > 0)) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 mb-2">
            {pathway.demandScore > 0 && (
              <div className="bg-white/80 p-5 rounded-2xl border border-white shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4 text-slate-500 font-bold uppercase text-xs tracking-wider"><TrendingUp className="w-4 h-4" /><span>Market Reality</span></div>
                <DemandGauge score={pathway.demandScore} />
                <p className="text-xs text-slate-500 mt-4 leading-relaxed bg-slate-50 p-2 rounded-lg">{pathway.marketReality}</p>
              </div>
            )}
            {pathway.salaryRange && pathway.salaryRange.max > 0 && (
              <div className="bg-white/80 p-5 rounded-2xl border border-white shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1 text-slate-500 font-bold uppercase text-xs tracking-wider"><div className="text-sm">Est. Monthly Income</div></div>
                <div className="flex items-baseline gap-1 mt-1"><span className="text-3xl font-bold text-slate-800 tracking-tight">{pathway.salaryRange.currency} {pathway.salaryRange.max.toLocaleString()}</span><span className="text-xs text-slate-500 font-medium">/mo (Senior)</span></div>
                <SalaryChart min={pathway.salaryRange.min} max={pathway.salaryRange.max} currency={pathway.salaryRange.currency} />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="glass-card p-8 rounded-3xl border-l-4 border-l-emerald-600">
        <h4 className="flex flex-col gap-1 mb-6">
          <span className="text-emerald-900 text-2xl font-black">You don't need to figure everything out today. Start here.</span>
          <span className="text-slate-500 text-sm font-medium">Small steps to take this week</span>
        </h4>
        <ul className="space-y-1">
          {safeArray(pathway.actionSteps).map((step, i) => (
             <ActionStepCheckbox key={i} step={step} id={`step-${type}-${i}-${pathway.title.substring(0,5)}`} />
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <AccordionItem title="Required Skills" icon={Target} iconColor="text-emerald-600">
          <div className="space-y-5">
            <div><p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Technical</p><div className="flex flex-wrap gap-2">{safeArray(pathway.requiredSkills?.technical).map((skill, i) => (<span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg border border-slate-200">{skill}</span>))}</div></div>
            <div><p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Soft Skills</p><div className="flex flex-wrap gap-2">{safeArray(pathway.requiredSkills?.soft).map((skill, i) => (<span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-800 text-sm font-medium rounded-lg border border-amber-100">{skill}</span>))}</div></div>
          </div>
        </AccordionItem>
        <AccordionItem title="Education & Timeline" icon={BookOpen} iconColor="text-blue-600">
          <div className="mb-5 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-4 py-3 rounded-xl border border-blue-100"><Clock className="w-4 h-4" /><span>Expected Timeline: <strong>{pathway.timeline}</strong></span></div>
          <ul className="space-y-3 pl-1">{safeArray(pathway.educationOptions).map((opt, i) => (<li key={i} className="flex items-start gap-3 text-sm text-slate-700 font-medium"><span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" /><span className="leading-relaxed">{opt}</span></li>))}</ul>
        </AccordionItem>
        <AccordionItem title="Challenges & Risks" icon={AlertTriangle} iconColor="text-amber-500">
          <ul className="space-y-3 pl-1">{safeArray(pathway.challenges).map((challenge, i) => (<li key={i} className="flex items-start gap-3 text-sm text-slate-700 font-medium"><span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" /><span className="leading-relaxed">{challenge}</span></li>))}</ul>
        </AccordionItem>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto pb-24 pt-8 px-4 md:px-0">
      
      {/* 1. Reflection Card - Lead with this */}
      <Reveal delay={0}>
         <div className="mb-12 relative">
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shadow-sm z-10">
              <Sparkles className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="bg-[#fffef0] p-8 md:p-12 rounded-sm shadow-xl border border-emerald-100/50 relative transform -rotate-1 hover:rotate-0 transition-transform duration-500">
              <h4 className="text-emerald-900/40 font-bold uppercase tracking-widest text-sm mb-6">Here's what I heard:</h4>
              <p className="text-2xl md:text-3xl text-emerald-950 font-medium leading-relaxed italic" style={{fontFamily: 'Georgia, serif'}}>
                {data.reflection}
              </p>
              <div className="mt-8 pt-8 border-t border-emerald-900/10 flex justify-end">
                <span className="text-emerald-900/30 font-bold italic">— CareerSage</span>
              </div>
            </div>
         </div>
      </Reveal>

      {/* 2. Intro to Pathways */}
      <Reveal delay={700}>
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-4">I have two pathways for you.</h2>
          <p className="text-slate-600 text-lg">One is about stability right now, the other is about where we can take this in the long run.</p>
        </div>
      </Reveal>

      {/* 3. The Pathways UI */}
      <Reveal delay={1200}>
        <div className="mb-12">
            <div className="flex justify-center p-2 bg-emerald-900/5 backdrop-blur-md rounded-full mb-10 max-w-xl mx-auto border border-emerald-900/10 shadow-inner">
              <button 
                onClick={() => setActiveTab('practical')} 
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-full text-sm font-black transition-all ${activeTab === 'practical' ? 'bg-emerald-900 text-white shadow-lg' : 'text-emerald-900/60 hover:text-emerald-900 hover:bg-white/50'}`}
              >
                  <Briefcase className="w-4 h-4" /> What you can do right now
              </button>
              <button 
                onClick={() => setActiveTab('growth')} 
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-full text-sm font-black transition-all ${activeTab === 'growth' ? 'bg-orange-600 text-white shadow-lg' : 'text-orange-900/60 hover:text-orange-900 hover:bg-white/50'}`}
              >
                  <TrendingUp className="w-4 h-4" /> Where you can actually be in 5 years
              </button>
            </div>

            {activeTab === 'practical' ? renderPathway(data.practicalPathway, 'practical') : renderPathway(data.growthPathway, 'growth')}
        </div>
      </Reveal>

      {/* 4. Sources */}
      {data.sources && data.sources.length > 0 && (
        <Reveal delay={1700}>
            <div className="max-w-4xl mx-auto mb-16">
            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4 pl-1">Checked these sources for you:</h4>
            <div className="flex flex-wrap gap-3">
                {data.sources.map((source, i) => (
                <a key={i} href={source.uri} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-blue-600 font-medium hover:text-blue-800 hover:bg-blue-50 transition-all hover:-translate-y-0.5 shadow-sm">
                    <span className="truncate max-w-[150px]">{source.title}</span><ExternalLink className="w-3 h-3" />
                </a>
                ))}
            </div>
            </div>
        </Reveal>
      )}

      {/* 5. Closing */}
      <Reveal delay={2000}>
        <div className="bg-emerald-950 text-white rounded-[2rem] p-10 md:p-16 text-center relative overflow-hidden space-y-8 shadow-2xl shadow-emerald-900/40">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-400 via-transparent to-transparent"></div>
            
            <div className="relative z-10">
              <h4 className="text-xs font-bold text-emerald-400 mb-6 uppercase tracking-[0.3em]">This is your starting point, not your ceiling.</h4>
              <p className="text-emerald-100 mb-12 max-w-2xl mx-auto text-xl md:text-2xl leading-relaxed opacity-90 font-medium italic">"{data.closingMessage}"</p>
              
              <div className="flex justify-center pt-8 border-t border-white/10">
                <button onClick={onReset} className="inline-flex items-center gap-3 px-10 py-4 bg-white text-emerald-950 rounded-full font-black text-lg hover:bg-emerald-50 transition-all shadow-xl hover:-translate-y-1 active:scale-95 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none">
                  Start a new session <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
        </div>
      </Reveal>
    </div>
  );
};

export default ResultView;
