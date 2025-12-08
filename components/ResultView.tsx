/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState } from 'react';
import { CareerAdviceResponse, Pathway } from '../types';
import { BookOpen, Briefcase, CheckCircle, AlertTriangle, TrendingUp, Clock, Target, ArrowRight } from 'lucide-react';

interface ResultViewProps {
  data: CareerAdviceResponse;
  onReset: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ data, onReset }) => {
  const [activeTab, setActiveTab] = useState<'practical' | 'growth'>('practical');

  const renderPathway = (pathway: Pathway, type: 'practical' | 'growth') => (
    <div className="animate-fadeIn">
      <div className={`p-6 rounded-2xl mb-6 ${type === 'practical' ? 'bg-blue-50 border border-blue-100' : 'bg-purple-50 border border-purple-100'}`}>
        <h3 className={`text-2xl font-bold mb-2 ${type === 'practical' ? 'text-blue-900' : 'text-purple-900'}`}>
          {pathway.title}
        </h3>
        <p className="text-slate-700 leading-relaxed mb-4">{pathway.fitReason}</p>
        
        <div className="flex flex-wrap gap-3 mb-4">
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

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
            <Target className="w-5 h-5 text-emerald-600" />
            Required Skills
          </h4>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Technical</p>
              <div className="flex flex-wrap gap-2">
                {pathway.requiredSkills.technical.map((skill, i) => (
                  <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 text-sm rounded-md">{skill}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Soft Skills</p>
              <div className="flex flex-wrap gap-2">
                {pathway.requiredSkills.soft.map((skill, i) => (
                  <span key={i} className="px-2 py-1 bg-amber-50 text-amber-800 text-sm rounded-md">{skill}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <h4 className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Education & Learning
          </h4>
          <ul className="space-y-2">
            {pathway.educationOptions.map((opt, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                {opt}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="flex items-center gap-2 font-semibold text-slate-900 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Challenges & Risks
          </h4>
          <ul className="space-y-2">
            {pathway.challenges.map((challenge, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                 <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                 {challenge}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm ring-1 ring-emerald-50">
          <h4 className="flex items-center gap-2 font-semibold text-emerald-900 mb-4">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Immediate Action Steps
          </h4>
          <ul className="space-y-3">
            {pathway.actionSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </div>
                <span className="text-sm text-slate-800">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto pb-20">
      {/* Overview Section */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-8 mb-8">
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
      <div className="mb-8">
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
      <div className="bg-emerald-900 text-white rounded-2xl p-8 text-center relative overflow-hidden">
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