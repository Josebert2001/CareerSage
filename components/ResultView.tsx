import React, { useState } from 'react';
import { CareerAdviceResponse, Pathway } from '../types';
import { BookOpen, Briefcase, CheckCircle, AlertTriangle, TrendingUp, Clock, Target, ArrowRight, ChevronDown } from 'lucide-react';

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

const ResultView: React.FC<ResultViewProps> = ({ data, onReset }) => {
  const [activeTab, setActiveTab] = useState<'practical' | 'growth'>('practical');

  const renderPathway = (pathway: Pathway, type: 'practical' | 'growth') => (
    <div className="animate-fadeIn space-y-6">
      {/* Header Section */}
      <div className={`p-6 rounded-2xl ${type === 'practical' ? 'bg-blue-50 border border-blue-100' : 'bg-purple-50 border border-purple-100'}`}>
        <h3 className={`text-2xl font-bold mb-2 ${type === 'practical' ? 'text-blue-900' : 'text-purple-900'}`}>
          {pathway.title}
        </h3>
        <p className="text-slate-700 leading-relaxed mb-4">{pathway.fitReason}</p>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">{pathway.timeline}</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
            <TrendingUp className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Market: {pathway.marketReality}</span>
          </div>
        </div>
      </div>

      {/* Action Steps - Always visible for impact */}
      <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm ring-1 ring-emerald-50">
        <h4 className="flex items-center gap-2 font-semibold text-emerald-900 mb-4">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          Immediate Action Steps
        </h4>
        <ul className="space-y-3">
          {pathway.actionSteps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                {i + 1}
              </div>
              <span className="text-sm text-slate-800 leading-relaxed">{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Accordions for Details */}
      <div className="space-y-4">
        <AccordionItem 
          title="Required Skills" 
          icon={Target} 
          iconColor="text-emerald-600"
          defaultOpen={true}
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Technical</p>
              <div className="flex flex-wrap gap-2">
                {pathway.requiredSkills.technical.map((skill, i) => (
                  <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 text-sm rounded-md border border-slate-200">{skill}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Soft Skills</p>
              <div className="flex flex-wrap gap-2">
                {pathway.requiredSkills.soft.map((skill, i) => (
                  <span key={i} className="px-2 py-1 bg-amber-50 text-amber-800 text-sm rounded-md border border-amber-100">{skill}</span>
                ))}
              </div>
            </div>
          </div>
        </AccordionItem>

        <AccordionItem 
          title="Education & Learning" 
          icon={BookOpen} 
          iconColor="text-blue-600"
        >
          <ul className="space-y-3">
            {pathway.educationOptions.map((opt, i) => (
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
            {pathway.challenges.map((challenge, i) => (
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
        </div>
        
        <div className="flex flex-wrap gap-2">
          {data.studentProfile.keyStrengths.map((strength, i) => (
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

      {/* Closing */}
      <div className="bg-emerald-900 text-white rounded-2xl p-8 text-center relative overflow-hidden animate-fadeIn" style={{ animationDelay: '0.2s' }}>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <h3 className="text-xl font-bold mb-3 relative z-10">A Note from CareerSage</h3>
        <p className="text-emerald-100 mb-6 max-w-2xl mx-auto relative z-10">
          {data.closingMessage}
        </p>
        <button 
          onClick={onReset}
          className="relative z-10 inline-flex items-center gap-2 px-6 py-2 bg-white text-emerald-900 rounded-full font-semibold hover:bg-emerald-50 transition-colors"
        >
          Start New Session
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ResultView;