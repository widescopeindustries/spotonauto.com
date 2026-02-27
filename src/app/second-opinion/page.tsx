'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  HelpCircle,
  Search,
  Lightbulb,
  Lock,
  Loader2,
  CheckCircle2,
  XCircle,
  TrendingDown,
} from 'lucide-react';
import { getYears, COMMON_MAKES, fetchModels } from '@/services/vehicleData';
import { useAuth } from '@/contexts/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────
interface SecondOpinionResult {
  verdict: 'Fair Price' | 'Seems High' | 'Red Flag' | 'Seems Low';
  confidence: string;
  avgPrice: number;
  priceRange: { low: number; high: number };
  summary: string;
  flags: string[];
  commonMisdiagnoses: string[];
  questionsToAsk: string[];
  alternatives: string[];
  partsBreakdown: string;
  vehicle: { year: string; make: string; model: string };
  quotedPrice: number;
  mechanicDiagnosis: string;
}

type VerdictStyle = {
  bg: string;
  border: string;
  text: string;
  glow: string;
  icon: React.ReactNode;
  label: string;
};

const VERDICT_STYLES: Record<string, VerdictStyle> = {
  'Fair Price': {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
    glow: 'shadow-[0_0_30px_rgba(16,185,129,0.2)]',
    icon: <ShieldCheck className="w-10 h-10" />,
    label: 'Fair Price',
  },
  'Seems High': {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.2)]',
    icon: <ShieldAlert className="w-10 h-10" />,
    label: 'Seems High',
  },
  'Red Flag': {
    bg: 'bg-red-500/10',
    border: 'border-red-500/40',
    text: 'text-red-400',
    glow: 'shadow-[0_0_30px_rgba(239,68,68,0.2)]',
    icon: <AlertTriangle className="w-10 h-10" />,
    label: 'Red Flag',
  },
  'Seems Low': {
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/40',
    text: 'text-sky-400',
    glow: 'shadow-[0_0_30px_rgba(14,165,233,0.2)]',
    icon: <TrendingDown className="w-10 h-10" />,
    label: 'Seems Low',
  },
};

// ── Verdict Card ──────────────────────────────────────────────────────────────
function VerdictCard({ result }: { result: SecondOpinionResult }) {
  const style = VERDICT_STYLES[result.verdict] || VERDICT_STYLES['Fair Price'];
  const vehicleStr = `${result.vehicle.year} ${result.vehicle.make} ${result.vehicle.model}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-2xl mx-auto space-y-5"
    >
      {/* Main Verdict */}
      <div className={`${style.bg} ${style.border} ${style.glow} border rounded-2xl p-6 sm:p-8 text-center`}>
        <div className={`${style.text} flex justify-center mb-3`}>{style.icon}</div>
        <h2 className={`font-display font-black text-3xl sm:text-4xl ${style.text} tracking-wider mb-2`}>
          {style.label.toUpperCase()}
        </h2>
        <p className="text-gray-300 font-body text-sm sm:text-base max-w-lg mx-auto">
          {result.summary}
        </p>
        <div className="mt-4 flex items-center justify-center gap-1 text-xs text-gray-500 font-mono">
          <Shield className="w-3 h-3" />
          Confidence: {result.confidence} &middot; {vehicleStr}
        </div>
      </div>

      {/* Price Comparison */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
        <h3 className="font-display text-sm tracking-widest text-gray-400 uppercase mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-cyan-400" />
          Price Analysis
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div>
            <div className="text-xs text-gray-500 font-mono uppercase mb-1">Typical Low</div>
            <div className="text-lg font-bold text-gray-300">${result.priceRange.low.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-mono uppercase mb-1">Average</div>
            <div className="text-lg font-bold text-cyan-400">${result.avgPrice.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-mono uppercase mb-1">Typical High</div>
            <div className="text-lg font-bold text-gray-300">${result.priceRange.high.toLocaleString()}</div>
          </div>
        </div>
        {/* Visual bar */}
        <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden mt-2">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/60 via-cyan-500/60 to-amber-500/60 rounded-full"
            style={{ width: '100%' }}
          />
          {/* Quoted price marker */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-cyan-400 shadow-[0_0_8px_rgba(0,212,255,0.6)]"
            style={{
              left: `${Math.min(Math.max(((result.quotedPrice - result.priceRange.low) / (result.priceRange.high - result.priceRange.low)) * 100, 2), 98)}%`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-600 font-mono">${result.priceRange.low}</span>
          <span className="text-[10px] text-cyan-400 font-mono">Your quote: ${result.quotedPrice.toLocaleString()}</span>
          <span className="text-[10px] text-gray-600 font-mono">${result.priceRange.high}</span>
        </div>
        <p className="text-xs text-gray-500 mt-3">{result.partsBreakdown}</p>
      </div>

      {/* Flags */}
      {result.flags.length > 0 && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <h3 className="font-display text-sm tracking-widest text-gray-400 uppercase mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Watch Out For
          </h3>
          <ul className="space-y-2">
            {result.flags.map((flag, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-amber-400 mt-0.5 shrink-0">&#9679;</span>
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Common Misdiagnoses */}
      {result.commonMisdiagnoses.length > 0 && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <h3 className="font-display text-sm tracking-widest text-gray-400 uppercase mb-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-cyan-400" />
            Common Misdiagnoses
          </h3>
          <ul className="space-y-2">
            {result.commonMisdiagnoses.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-cyan-400 mt-0.5 shrink-0">&#9679;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Questions to Ask */}
      {result.questionsToAsk.length > 0 && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <h3 className="font-display text-sm tracking-widest text-gray-400 uppercase mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            Questions to Ask Your Mechanic
          </h3>
          <ul className="space-y-2">
            {result.questionsToAsk.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-emerald-400 font-bold shrink-0">{i + 1}.</span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Alternatives */}
      {result.alternatives.length > 0 && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <h3 className="font-display text-sm tracking-widest text-gray-400 uppercase mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            Alternative Diagnoses to Consider
          </h3>
          <ul className="space-y-2">
            {result.alternatives.map((alt, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-yellow-400 mt-0.5 shrink-0">&#9679;</span>
                {alt}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pro Upgrade CTA */}
      <div className="bg-gradient-to-r from-cyan-500/5 to-purple-500/5 border border-cyan-500/20 rounded-2xl p-6 text-center">
        <Lock className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
        <h3 className="font-display text-lg text-white mb-1">Want More Detail?</h3>
        <p className="text-sm text-gray-400 mb-4 max-w-md mx-auto">
          Upgrade to Pro for zip code-specific pricing, detailed parts breakdown, save &amp; compare quotes, and unlimited checks.
        </p>
        <a
          href="/pricing"
          className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition-all text-sm"
        >
          Upgrade to Pro — $9.99/mo
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      {/* New Check button */}
      <div className="text-center pt-2">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-sm text-gray-500 hover:text-cyan-400 transition-colors font-mono"
        >
          &#8593; Check another quote
        </button>
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SecondOpinionPage() {
  const { user } = useAuth();
  const resultRef = useRef<HTMLDivElement>(null);

  // Vehicle selector state
  const [vehicle, setVehicle] = useState({ year: '', make: '', model: '' });
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const availableYears = getYears();

  // Form state
  const [mechanicDiagnosis, setMechanicDiagnosis] = useState('');
  const [quotedPrice, setQuotedPrice] = useState('');
  const [symptoms, setSymptoms] = useState('');

  // Submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SecondOpinionResult | null>(null);

  // Load models when make/year change
  useEffect(() => {
    if (vehicle.make && vehicle.year) {
      setLoadingModels(true);
      fetchModels(vehicle.make, vehicle.year)
        .then(m => { setAvailableModels(m); setLoadingModels(false); })
        .catch(() => setLoadingModels(false));
    } else {
      setAvailableModels([]);
    }
  }, [vehicle.make, vehicle.year]);

  // Scroll to result when it arrives
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  const canSubmit =
    vehicle.year &&
    vehicle.make &&
    vehicle.model &&
    mechanicDiagnosis.trim() &&
    quotedPrice.trim() &&
    !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    // Free tier: 1 check per day
    if (!user || user.tier === 'free') {
      const todayKey = `spoton_2nd_opinion_${new Date().toISOString().slice(0, 10)}`;
      const used = localStorage.getItem(todayKey);
      if (used) {
        setError('You\'ve used your free check today. Upgrade to Pro for unlimited checks.');
        return;
      }
      localStorage.setItem(todayKey, 'true');
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/second-opinion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          mechanicDiagnosis: mechanicDiagnosis.trim(),
          quotedPrice: quotedPrice.replace(/[^0-9.]/g, ''),
          symptoms: symptoms.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(data.error || 'Failed to get analysis');
      }

      const data: SecondOpinionResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      // Undo daily limit on error
      if (!user || user.tier === 'free') {
        const todayKey = `spoton_2nd_opinion_${new Date().toISOString().slice(0, 10)}`;
        localStorage.removeItem(todayKey);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 pt-28 pb-16 flex flex-col items-center w-full min-h-screen bg-[#050505]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10 max-w-2xl"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-4">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-400 font-mono text-xs tracking-widest uppercase">Quote Shield Active</span>
        </div>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white mb-3">
          Get a Free<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200">2nd Opinion</span>
        </h1>
        <p className="text-gray-400 font-body max-w-md mx-auto">
          Enter your mechanic's quote and our AI will tell you if the price is fair, what to watch out for, and the right questions to ask.
        </p>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-2xl bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-5"
      >
        {/* Step 1: Vehicle */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-xs font-bold">1</span>
            <span className="font-display text-sm tracking-widest text-gray-300 uppercase">Your Vehicle</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 font-mono uppercase tracking-wider mb-1.5">Year</label>
              <select
                value={vehicle.year}
                onChange={e => setVehicle({ ...vehicle, year: e.target.value, model: '' })}
                className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-200 focus:outline-none focus:border-cyan-500 text-sm appearance-none"
              >
                <option value="">Year</option>
                {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-mono uppercase tracking-wider mb-1.5">Make</label>
              <select
                value={vehicle.make}
                onChange={e => setVehicle({ ...vehicle, make: e.target.value, model: '' })}
                disabled={!vehicle.year}
                className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-200 focus:outline-none focus:border-cyan-500 text-sm appearance-none disabled:opacity-50"
              >
                <option value="">Make</option>
                {COMMON_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 font-mono uppercase tracking-wider mb-1.5">Model</label>
              <select
                value={vehicle.model}
                onChange={e => setVehicle({ ...vehicle, model: e.target.value })}
                disabled={!vehicle.make || loadingModels}
                className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-3 py-2.5 text-gray-200 focus:outline-none focus:border-cyan-500 text-sm appearance-none disabled:opacity-50"
              >
                <option value="">{loadingModels ? 'Loading...' : 'Model'}</option>
                {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Mechanic's Diagnosis */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-xs font-bold">2</span>
            <span className="font-display text-sm tracking-widest text-gray-300 uppercase">Mechanic's Diagnosis</span>
          </div>
          <textarea
            value={mechanicDiagnosis}
            onChange={e => setMechanicDiagnosis(e.target.value)}
            placeholder="e.g. Catalytic converter needs replacement, front brake pads and rotors, alternator is failing..."
            rows={3}
            className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 text-sm resize-none"
          />
        </div>

        {/* Step 3: Quoted Price */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-xs font-bold">3</span>
            <span className="font-display text-sm tracking-widest text-gray-300 uppercase">Quoted Price</span>
          </div>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              inputMode="decimal"
              value={quotedPrice}
              onChange={e => setQuotedPrice(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="1,200"
              className="w-full bg-gray-900/80 border border-gray-700 rounded-lg pl-8 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 text-sm"
            />
          </div>
        </div>

        {/* Step 4: Symptoms (optional) */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 text-xs font-bold">4</span>
            <span className="font-display text-sm tracking-widest text-gray-500 uppercase">
              Symptoms You Noticed <span className="text-gray-600 normal-case tracking-normal">(optional)</span>
            </span>
          </div>
          <input
            type="text"
            value={symptoms}
            onChange={e => setSymptoms(e.target.value)}
            placeholder="e.g. Check engine light, rough idle, rattling noise at startup..."
            className="w-full bg-gray-900/80 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 text-sm"
          />
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
            >
              <XCircle className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-3 py-4 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all text-base"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing Quote...
            </>
          ) : (
            <>
              <Shield className="w-5 h-5" />
              Get My 2nd Opinion
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-600">
          Free &middot; 1 check per day &middot; Powered by AI
        </p>
      </motion.div>

      {/* Common repairs quick-picks */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="mt-6 max-w-2xl w-full"
      >
        <p className="text-center text-xs text-gray-600 font-mono uppercase tracking-widest mb-3">Common repairs to check</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            'Catalytic converter replacement',
            'Brake pads and rotors',
            'Transmission rebuild',
            'AC compressor',
            'Head gasket repair',
            'Timing belt replacement',
          ].map(repair => (
            <button
              key={repair}
              onClick={() => setMechanicDiagnosis(repair)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                mechanicDiagnosis === repair
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-cyan-500/50 hover:text-gray-200'
              }`}
            >
              {repair}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Result */}
      <div ref={resultRef} className="w-full mt-10">
        <AnimatePresence>
          {result && <VerdictCard result={result} />}
        </AnimatePresence>
      </div>

      {/* Trust / How It Works */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-16 max-w-2xl w-full"
      >
        <h2 className="text-center font-display text-lg text-white mb-6">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: <Search className="w-6 h-6 text-cyan-400" />,
              title: 'Enter Your Quote',
              desc: 'Tell us your vehicle, what the mechanic said, and how much they quoted.',
            },
            {
              icon: <Shield className="w-6 h-6 text-cyan-400" />,
              title: 'AI Analyzes',
              desc: 'Our AI compares against pricing databases, common issues, and known misdiagnoses.',
            },
            {
              icon: <CheckCircle2 className="w-6 h-6 text-cyan-400" />,
              title: 'Get Your Verdict',
              desc: 'See if the price is fair, what questions to ask, and what to watch out for.',
            },
          ].map((step, i) => (
            <div
              key={i}
              className="bg-white/[0.03] border border-white/10 rounded-xl p-5 text-center"
            >
              <div className="flex justify-center mb-3">{step.icon}</div>
              <h3 className="font-display text-sm text-white mb-1">{step.title}</h3>
              <p className="text-xs text-gray-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
