
import React, { useState } from 'react';
import { CareerAdviceResponse, Pathway } from '../types';
import { BookOpen, Briefcase, CheckCircle, AlertTriangle, TrendingUp, Clock, Target, ArrowRight, ChevronDown, ExternalLink, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ResultViewProps {
  data: CareerAdviceResponse;
  onReset: () => void;
}

interface AccordionItemProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  iconColor?: string;
  defaultOpen?: boolean;
  className?: string;
}

// Helper to safely map over potentially undefined arrays
const safeArray = <T,>(arr: T[] | undefined | null): T[] => Array.isArray(arr) ? arr : [];

const AccordionItem: React.FC<AccordionItemProps> = ({ 
  title, 
  icon: Icon, 
  children, 
  iconColor = "text-slate-500", 
  defaultOpen = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm transition-all duration-200 ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-100"
        type="button"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 font-semibold text-slate-800">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          {title}
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      {
        isOpen && (
          <div className="p-5 border-t border-slate-100 animate-fadeIn">
            {children}
          </div>
        )
      }
    </div>
  );
};

// --- Custom Components for Charts ---

const SalaryChart: React.FC<{ min: number; max: number; currency: string }> = ({ min, max, currency }) => {
  if (!min || !max || min === 0 || max === 0) return null;
  
  const data = [
    { name: 'Entry', amount: min },
    { name: 'Senior', amount: max },
  ];

  return (
    <div className="h-48 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
          <YAxis hide />
          <Tooltip 
            cursor={{fill: '#f1f5f9'}}
            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
            formatter={(value: number) => [`${currency} ${value.toLocaleString()}`, 'Salary']}
          />
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

  // Score 0-100
  const color = score > 75 ? "bg-emerald-500" : score > 40 ? "bg-amber-500" : "bg-red-500";
  const text = score > 75 ? "High Demand" : score > 40 ? "Moderate" : "Low Demand";
  
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-xs font-medium text-slate-500 uppercase">
        <span>Saturation</span>
        <span>High Growth</span>
      </div>
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-1000 ease-out`} 
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="flex justify-end">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color} bg-opacity-10 text-slate-700`}>
          {text} ({score}/100)
        </span>
      </div>
    </div>
  );
};

// --- Checkbox Logic for LocalStorage ---
const ActionStepCheckbox: React.FC<{ step: string; id: string }> = ({ step, id }) => {
  const [checked, setChecked] = useState(() => {
    return localStorage.getItem(id) === 'true';
  });

  const toggle = () => {
    const newState = !checked;
    setChecked(newState);
    localStorage.setItem(id, String(newState));
  };

  return (
    <li className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer" onClick={toggle}>
      <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${checked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'}`}>
        {checked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
      </div>
      <span className={`text-sm leading-relaxed transition-all ${checked ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
        {step}
      </span>
    </li>
  );
};

const ResultView: React.FC<ResultViewProps> = ({ data, onReset }) => {
  if (!data) return null;
  
  const [activeTab, setActiveTab] = useState<'practical' | 'growth'>('practical');
  const [feedbackState, setFeedbackState] = useState<'none' | 'helpful' | 'not-helpful'>('none');

  const renderPathway = (pathway: Pathway, type: 'practical' | 'growth') => (
    <div className="animate-fadeIn space-y-6">
      {/* Header Section with Dashboard Cards */}
      <div className={`p-6 rounded-2xl ${type === 'practical' ? 'bg-blue-50 border border-blue-100' : 'bg-purple-50 border border-purple-100'}`}>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${type === 'practical' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                {type === 'practical' ? 'Short Term Plan' : 'Long Term Vision'}
              </span>
            </div>
            <h3 className={`text-2xl md:text-3xl font-bold ${type === 'practical' ? 'text-blue-900' : 'text-purple-900'}`}>
              {pathway.title}
            </h3>
          </div>
        </div>

        <p className="text-slate-700 leading-relaxed mb-6 bg-white/60 p-4 rounded-xl backdrop-blur-sm">
          {pathway.fitReason}
        </p>

        {/* Data Dashboard Grid - Conditionally Rendered */}
        {(pathway.demandScore > 0 || (pathway.salaryRange && pathway.salaryRange.max > 0)) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            {/* Card 1: Market Stats */}
            {pathway.demandScore > 0 && (
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-3 text-slate-500 font-medium">
                    <TrendingUp className="w-4 h-4" />
                    <span>Market Reality</span>
                </div>
                <DemandGauge score={pathway.demandScore} />
                <p className="text-xs text-slate-400 mt-3">{pathway.marketReality}</p>
              </div>
            )}

            {/* Card 2: Salary Estimates */}
            {pathway.salaryRange && pathway.salaryRange.max > 0 && (
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-1 text-slate-500 font-medium">
                    <div className="text-sm">Est. Monthly Income</div>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-800">
                      {pathway.salaryRange.currency} {pathway.salaryRange.max.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400">/mo (Senior)</span>
                </div>
                <SalaryChart 
                    min={pathway.salaryRange.min} 
                    max={pathway.salaryRange.max} 
                    currency={pathway.salaryRange.currency} 
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Steps - Prominent */}
      <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm ring-1 ring-emerald-50">
        <h4 className="flex items-center gap-2 font-semibold text-emerald-900 mb-4">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          Start This Week
        </h4>
        <ul className="space-y-1">
          {safeArray(pathway.actionSteps).map((step, i) => (
             <ActionStepCheckbox key={i} step={step} id={`step-${type}-${i}-${pathway.title.substring(0,5)}`} />
          ))}
        </ul>
      </div>

      {/* Accordions for Details */}
      <div className="space-y-4">
        <AccordionItem 
          title="Required Skills" 
          icon={Target} 
          iconColor="text-emerald-600"
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Technical</p>
              <div className="flex flex-wrap gap-2">
                {safeArray(pathway.requiredSkills?.technical).map((skill, i) => (
                  <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 text-sm rounded-md border border-slate-200">{skill}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Soft Skills</p>
              <div className="flex flex-wrap gap-2">
                {safeArray(pathway.requiredSkills?.soft).map((skill, i) => (
                  <span key={i} className="px-2 py-1 bg-amber-50 text-amber-800 text-sm rounded-md border border-amber-100">{skill}</span>
                ))}
              </div>
            </div>
          </div>
        </AccordionItem>

        <AccordionItem 
          title="Education & Timeline" 
          icon={BookOpen} 
          iconColor="text-blue-600"
        >
          <div className="mb-4 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
            <Clock className="w-4 h-4" />
            <span>Expected Timeline: <strong>{pathway.timeline}</strong></span>
          </div>
          <ul className="space-y-3">
            {safeArray(pathway.educationOptions).map((opt, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                <span className="leading-relaxed">{opt}</span>
              </li>
            ))}
          </ul>
        </AccordionItem>

        <AccordionItem 
          title="Challenges & Risks" 
          icon={AlertTriangle} 
          iconColor="text-amber-500"
        >
          <ul className="space-y-3">
            {safeArray(pathway.challenges).map((challenge, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                 <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                 <span className="leading-relaxed">{challenge}</span>
              </li>
            ))}
          </ul>
        </AccordionItem>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto pb-20">
      {/* Overview Section */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-8 mb-8 animate-fadeIn">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">Your Profile Analysis</h2>
        <div className="prose prose-slate max-w-none text-slate-600 mb-6">
          <p className="whitespace-pre-wrap">{data.studentProfile.summary}</p>
          <p className="mt-4 italic border-l-4 border-emerald-500 pl-4 py-1 bg-emerald-50 text-emerald-900 rounded-r-lg">
            {data.contextAnalysis}
          </p>
          {data.reflection && (
             <p className="mt-4 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-700 block mb-1">Observation:</span>
                {data.reflection}
             </p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {safeArray(data.studentProfile.keyStrengths).map((strength, i) => (
            <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded-full">
              {strength}
            </span>
          ))}
        </div>
      </div>

      {/* Pathways Tabs */}
      <div className="mb-8 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
        <div className="flex justify-center p-1 bg-slate-200 rounded-xl mb-6 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('practical')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'practical'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Practical Pathway
          </button>
          <button
            onClick={() => setActiveTab('growth')}
             className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'growth'
                ? 'bg-white text-purple-900 shadow-sm'
                : 'text-slate-600 hover:text-purple-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Growth Pathway
          </button>
        </div>

        {activeTab === 'practical' ? renderPathway(data.practicalPathway, 'practical') : renderPathway(data.growthPathway, 'growth')}
      </div>

      {/* Sources */}
      {data.sources && data.sources.length > 0 && (
        <div className="max-w-4xl mx-auto mb-8 animate-fadeIn">
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Sources & References</h4>
          <div className="flex flex-wrap gap-3">
            {data.sources.map((source, i) => (
              <a 
                key={i} 
                href={source.uri} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
              >
                <span className="truncate max-w-[150px]">{source.title}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Feedback & Closing */}
      <div className="bg-emerald-900 text-white rounded-2xl p-8 text-center relative overflow-hidden animate-fadeIn space-y-8" style={{ animationDelay: '0.2s' }}>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        
        {/* Feedback Section */}
        <div className="relative z-10 border-b border-emerald-800 pb-6">
           <h4 className="text-sm font-medium text-emerald-300 mb-3 uppercase tracking-wider">Was this advice helpful?</h4>
           <div className="flex justify-center gap-4">
             <button 
                onClick={() => setFeedbackState('helpful')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${feedbackState === 'helpful' ? 'bg-white text-emerald-900 border-white' : 'border-emerald-700 text-emerald-100 hover:bg-emerald-800'}`}
             >
                <ThumbsUp className="w-4 h-4" /> Yes
             </button>
             <button 
                onClick={() => setFeedbackState('not-helpful')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${feedbackState === 'not-helpful' ? 'bg-white text-emerald-900 border-white' : 'border-emerald-700 text-emerald-100 hover:bg-emerald-800'}`}
             >
                <ThumbsDown className="w-4 h-4" /> No
             </button>
           </div>
           {feedbackState !== 'none' && (
             <p className="text-xs text-emerald-300 mt-2 animate-fadeIn">Thanks for your feedback! We are constantly learning.</p>
           )}
        </div>

        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-3">A Note from CareerSage</h3>
          <p className="text-emerald-100 mb-6 max-w-2xl mx-auto">
            {data.closingMessage}
          </p>
          <div className="flex flex-col items-center gap-4">
            <button 
              onClick={onReset}
              className="inline-flex items-center gap-2 px-6 py-2 bg-white text-emerald-900 rounded-full font-semibold hover:bg-emerald-50 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Start New Session
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-emerald-400/60 max-w-lg leading-tight">
              Disclaimer: This AI tool provides educational guidance only. It accounts for general Nigerian/African market trends but does not replace professional legal, financial, or admission counseling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultView;
