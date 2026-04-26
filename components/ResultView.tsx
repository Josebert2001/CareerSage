
import React, { useState, useEffect } from 'react';
import { CareerAdviceResponse, Pathway, FutureVision } from '../types';
import {
  BookOpen, Briefcase, CheckCircle, AlertTriangle, TrendingUp,
  Clock, Target, ArrowRight, ChevronDown, ExternalLink,
  Sparkles, Gamepad2, Camera, Loader2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { generateFutureVision } from '../services/geminiService';

interface ResultViewProps {
  data: CareerAdviceResponse;
  onReset: () => void;
  onSimulate: (pathway: Pathway) => void;
}

/* ── Helpers ──────────────────────────────────────── */

const safeArray = <T,>(arr: T[] | undefined | null): T[] =>
  Array.isArray(arr) ? arr : [];

const Reveal: React.FC<{ delay: number; children: React.ReactNode }> = ({ delay, children }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  if (!visible) return null;
  return <div className="animate-fadeIn">{children}</div>;
};

/* ── Sub-components ───────────────────────────────── */

interface AccordionItemProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  iconColor?: string;
  defaultOpen?: boolean;
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  title, icon: Icon, children, iconColor = "text-slate-500", defaultOpen = false
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="solid-card rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3 font-semibold text-slate-800 text-sm">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          {title}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-slate-100 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
};

const SalaryChart: React.FC<{ min: number; max: number; currency: string }> = ({ min, max, currency }) => {
  if (!min || !max || min === 0 || max === 0) return null;
  const data = [{ name: 'Entry', amount: min }, { name: 'Senior', amount: max }];
  return (
    <div className="h-44 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            formatter={(value: number) => [`${currency} ${value.toLocaleString()}`, 'Salary']}
          />
          <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={38}>
            <Cell fill="#6ee7b7" />
            <Cell fill="#059669" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const DemandGauge: React.FC<{ score: number }> = ({ score }) => {
  if (score === undefined || score === 0) return null;
  const color    = score > 75 ? 'bg-emerald-500' : score > 40 ? 'bg-amber-500' : 'bg-red-400';
  const textColor= score > 75 ? 'text-emerald-700' : score > 40 ? 'text-amber-700' : 'text-red-600';
  const bgColor  = score > 75 ? 'bg-emerald-50'   : score > 40 ? 'bg-amber-50'   : 'bg-red-50';
  const label    = score > 75 ? 'High Demand'      : score > 40 ? 'Moderate'      : 'Low Demand';
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wide">
        <span>Few Jobs</span><span>Many Jobs</span>
      </div>
      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-1000 ease-out rounded-full`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="flex justify-end">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${bgColor} ${textColor}`}>
          {label} ({score}/100)
        </span>
      </div>
    </div>
  );
};

const ActionStepCheckbox: React.FC<{ step: string; id: string }> = ({ step, id }) => {
  const [checked, setChecked] = useState(() => localStorage.getItem(id) === 'true');
  const toggle = () => {
    const next = !checked;
    setChecked(next);
    localStorage.setItem(id, String(next));
  };
  return (
    <li
      className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
      onClick={toggle}
    >
      <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-200 ${
        checked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white group-hover:border-emerald-400'
      }`}>
        {checked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
      </div>
      <span className={`text-sm leading-relaxed font-medium transition-all ${
        checked ? 'text-slate-400 line-through' : 'text-slate-700'
      }`}>{step}</span>
    </li>
  );
};

/* ── Future Self Polaroid ─────────────────────────── */

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
        <div className="bg-white p-4 pb-12 rounded shadow-xl rotate-1 hover:rotate-0 transition-transform duration-500 border border-slate-200 max-w-xs mx-auto">
          <div className="aspect-square bg-slate-100 overflow-hidden mb-4 rounded-sm shadow-inner">
            <img
              src={`data:image/png;base64,${vision.imageData}`}
              alt={`Visualization: ${pathwayTitle}`}
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-center text-slate-700 text-base leading-snug px-2 font-serif italic">
            {vision.caption}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 border-2 border-dashed border-amber-200 rounded-2xl p-8 bg-amber-50/40 flex flex-col items-center text-center">
      <div className="bg-white p-3 rounded-full mb-3 shadow-md shadow-amber-500/10 border border-amber-100">
        <Camera className="w-5 h-5 text-amber-600" />
      </div>
      <h4 className="font-bold text-amber-900 mb-1">Visualize Your Future</h4>
      <p className="text-sm text-amber-700/80 mb-5 max-w-xs">See a snapshot of yourself in this role using AI.</p>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-full transition-all shadow-md shadow-amber-400/20 flex items-center gap-2 active:scale-95 disabled:opacity-70"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {loading ? 'Developing Photo…' : 'Generate Snapshot'}
      </button>
      {error && (
        <div role="alert" className="mt-4 px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 max-w-xs">
          {error}
        </div>
      )}
    </div>
  );
};

/* ── Main ResultView ──────────────────────────────── */

const ResultView: React.FC<ResultViewProps> = ({ data, onReset, onSimulate }) => {
  if (!data) return null;
  const [activeTab, setActiveTab] = useState<'practical' | 'growth'>('practical');

  const renderPathway = (pathway: Pathway, type: 'practical' | 'growth') => {
    const isPractical = type === 'practical';
    return (
      <div className="animate-fadeIn space-y-5">

        {/* ── Header card ─────────────────────────── */}
        <div className={`solid-card p-7 md:p-10 rounded-3xl border-t-4 ${
          isPractical ? 'border-t-emerald-500' : 'border-t-amber-500'
        }`}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <span className={`inline-block text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full mb-3 ${
                isPractical
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {isPractical ? 'Option A: Right Now' : 'Option B: The 5-Year Vision'}
              </span>
              <h3 className={`text-3xl md:text-4xl font-black tracking-tight leading-tight ${
                isPractical ? 'text-slate-900' : 'text-slate-900'
              }`}>
                {pathway.title}
              </h3>
            </div>

            <button
              onClick={() => onSimulate(pathway)}
              className="flex items-center gap-2 self-start bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-full font-semibold text-sm shadow-sm hover:border-emerald-300 hover:text-emerald-800 hover:shadow-md transition-all active:scale-95"
            >
              <Gamepad2 className="w-4 h-4 text-emerald-600" />
              Step into this life
            </button>
          </div>

          <p className="text-slate-600 text-base leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100">
            {pathway.fitReason}
          </p>

          {/* Future Vision */}
          <FutureSelfPolaroid
            pathwayTitle={pathway.title}
            userContext={`${data.studentProfile.summary} Location: Nigeria/Africa.`}
          />

          {(pathway.demandScore > 0 || (pathway.salaryRange && pathway.salaryRange.max > 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              {pathway.demandScore > 0 && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-4 text-slate-500 font-bold uppercase text-xs tracking-wider">
                    <TrendingUp className="w-3.5 h-3.5" /><span>Market Reality</span>
                  </div>
                  <DemandGauge score={pathway.demandScore} />
                  {pathway.marketReality && (
                    <p className="text-xs text-slate-500 mt-4 leading-relaxed">{pathway.marketReality}</p>
                  )}
                </div>
              )}
              {pathway.salaryRange && pathway.salaryRange.max > 0 && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Est. Monthly Income</div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      {pathway.salaryRange.currency} {pathway.salaryRange.max.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">/mo (Senior)</span>
                  </div>
                  <SalaryChart min={pathway.salaryRange.min} max={pathway.salaryRange.max} currency={pathway.salaryRange.currency} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Action Steps ─────────────────────────── */}
        <div className="solid-card p-7 rounded-3xl border-l-4 border-l-emerald-500">
          <h4 className="font-black text-slate-900 text-xl mb-1">You don't need to figure everything out today.</h4>
          <p className="text-slate-500 text-sm mb-5">Small steps to take this week</p>
          <ul className="space-y-1">
            {safeArray(pathway.actionSteps).map((step, i) => (
              <ActionStepCheckbox key={i} step={step} id={`step-${type}-${i}-${pathway.title.substring(0,5)}`} />
            ))}
          </ul>
        </div>

        {/* ── Accordion details ─────────────────────── */}
        <div className="space-y-3">
          <AccordionItem title="Required Skills" icon={Target} iconColor="text-emerald-600">
            <div className="space-y-5 pt-4">
              <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Technical</p>
                <div className="flex flex-wrap gap-2">
                  {safeArray(pathway.requiredSkills?.technical).map((skill, i) => (
                    <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200">{skill}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Soft Skills</p>
                <div className="flex flex-wrap gap-2">
                  {safeArray(pathway.requiredSkills?.soft).map((skill, i) => (
                    <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-800 text-xs font-semibold rounded-lg border border-amber-100">{skill}</span>
                  ))}
                </div>
              </div>
            </div>
          </AccordionItem>

          <AccordionItem title="Education & Timeline" icon={BookOpen} iconColor="text-blue-500">
            <div className="pt-4">
              <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-4 py-3 rounded-xl border border-blue-100 mb-4">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>Expected Timeline: <strong>{pathway.timeline}</strong></span>
              </div>
              <ul className="space-y-2.5">
                {safeArray(pathway.educationOptions).map((opt, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    <span className="leading-relaxed">{opt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AccordionItem>

          <AccordionItem title="Challenges & Risks" icon={AlertTriangle} iconColor="text-amber-500">
            <ul className="space-y-2.5 pt-4">
              {safeArray(pathway.challenges).map((challenge, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  <span className="leading-relaxed">{challenge}</span>
                </li>
              ))}
            </ul>
          </AccordionItem>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-24 pt-6">

      {/* 1. Reflection Card */}
      <Reveal delay={0}>
        <div className="mb-12 relative">
          <div className="absolute -top-3 -left-3 w-10 h-10 bg-emerald-100 border border-emerald-200 rounded-full flex items-center justify-center shadow-sm z-10">
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>
          <div
            className="p-8 md:p-12 rounded-sm shadow-2xl border border-emerald-50 relative transform -rotate-1 hover:rotate-0 transition-transform duration-500"
            style={{ background: '#fffef5', fontFamily: 'Lora, Georgia, serif' }}
          >
            <p className="text-[10px] font-sans font-extrabold text-emerald-800/40 uppercase tracking-[0.25em] mb-5">
              Here's what I heard:
            </p>
            <p className="text-xl md:text-2xl text-emerald-950 leading-relaxed italic">
              {data.reflection}
            </p>
            <div className="mt-8 pt-6 border-t border-emerald-900/10 flex justify-end">
              <span className="text-xs font-sans font-bold text-emerald-800/30 italic tracking-wide">— CareerSage</span>
            </div>
          </div>
        </div>
      </Reveal>

      {/* 2. Intro */}
      <Reveal delay={600}>
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3">I have two pathways for you.</h2>
          <p className="text-slate-500">One is about stability right now, the other is where this can go.</p>
        </div>
      </Reveal>

      {/* 3. Tab switcher */}
      <Reveal delay={1000}>
        <div className="mb-8">
          <div className="flex gap-2 p-2 bg-slate-100 rounded-2xl max-w-lg mx-auto mb-10 border border-slate-200">
            <button
              onClick={() => setActiveTab('practical')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeTab === 'practical'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span className="hidden xs:inline">Right Now</span>
              <span className="xs:hidden">Now</span>
            </button>
            <button
              onClick={() => setActiveTab('growth')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeTab === 'growth'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-400/30'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden xs:inline">5-Year Vision</span>
              <span className="xs:hidden">5 Yrs</span>
            </button>
          </div>

          {activeTab === 'practical'
            ? renderPathway(data.practicalPathway, 'practical')
            : renderPathway(data.growthPathway, 'growth')
          }
        </div>
      </Reveal>

      {/* 4. Sources */}
      {data.sources && data.sources.length > 0 && (
        <Reveal delay={1500}>
          <div className="mb-14">
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Checked these sources for you:</p>
            <div className="flex flex-wrap gap-2">
              {data.sources.map((source, i) => (
                <a
                  key={i}
                  href={source.uri}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-blue-600 font-medium hover:text-blue-800 hover:bg-blue-50 hover:-translate-y-0.5 transition-all shadow-sm"
                >
                  <span className="truncate max-w-[150px]">{source.title}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* 5. Closing */}
      <Reveal delay={1800}>
        <div
          className="rounded-3xl p-10 md:p-16 text-center relative overflow-hidden space-y-6 shadow-2xl shadow-emerald-900/30"
          style={{ background: 'linear-gradient(135deg, #022c22 0%, #064e3b 60%, #065f46 100%)' }}
        >
          <div className="absolute inset-0 opacity-[0.06] dot-pattern" />
          <div className="relative z-10">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-[0.3em] mb-4">
              This is your starting point, not your ceiling.
            </p>
            <blockquote
              className="text-emerald-100 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed mb-10"
              style={{ fontFamily: 'Lora, Georgia, serif', fontStyle: 'italic' }}
            >
              "{data.closingMessage}"
            </blockquote>
            <div className="flex justify-center pt-8 border-t border-white/10">
              <button
                onClick={onReset}
                className="inline-flex items-center gap-3 px-10 py-4 bg-white text-emerald-950 rounded-full font-black text-base hover:bg-emerald-50 transition-all shadow-xl hover:-translate-y-1 active:scale-95"
              >
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
