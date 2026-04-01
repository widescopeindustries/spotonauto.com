'use client';

import { useState } from 'react';
import TopdonProductCard from './TopdonProductCard';
import {
  TOPDON_PRODUCTS,
  type TopdonProduct,
} from '@/lib/topdonAffiliate';

type Goal = 'codes' | 'advanced' | 'battery' | 'everything';
type Budget = '50' | '100' | '250' | '400' | 'any';

const GOAL_OPTIONS: { value: Goal; label: string; desc: string }[] = [
  { value: 'codes', label: 'Read / clear check engine codes', desc: 'Basic OBD2 scanning' },
  { value: 'advanced', label: 'ABS, airbag, or transmission diagnostics', desc: 'Deeper system access' },
  { value: 'battery', label: 'Test my battery & charging system', desc: 'Battery health, alternator' },
  { value: 'everything', label: 'Full vehicle diagnostics + resets', desc: 'All systems, all modules' },
];

const BUDGET_OPTIONS: { value: Budget; label: string }[] = [
  { value: '50', label: 'Under $50' },
  { value: '100', label: 'Under $100' },
  { value: '250', label: 'Under $250' },
  { value: '400', label: 'Under $400' },
  { value: 'any', label: 'Show me the best' },
];

function getRecommendation(goal: Goal, budget: Budget): TopdonProduct[] {
  if (goal === 'battery') {
    if (budget === '50') return [TOPDON_PRODUCTS.bt50];
    if (budget === '100') return [TOPDON_PRODUCTS.bt50, TOPDON_PRODUCTS.bt200];
    return [TOPDON_PRODUCTS.bt200, TOPDON_PRODUCTS.bt600];
  }
  if (goal === 'codes') {
    if (budget === '50') return [TOPDON_PRODUCTS.artilink300, TOPDON_PRODUCTS.topscan];
    if (budget === '100') return [TOPDON_PRODUCTS.topscan, TOPDON_PRODUCTS.artilink600];
    return [TOPDON_PRODUCTS.topscan, TOPDON_PRODUCTS.artidiag500];
  }
  if (goal === 'advanced') {
    if (budget === '50') return [TOPDON_PRODUCTS.topscan];
    if (budget === '100') return [TOPDON_PRODUCTS.artilink600];
    if (budget === '250') return [TOPDON_PRODUCTS.artidiag600s];
    return [TOPDON_PRODUCTS.artidiag900lite, TOPDON_PRODUCTS.artidiagpro];
  }
  // everything
  if (budget === '50') return [TOPDON_PRODUCTS.topscan];
  if (budget === '100') return [TOPDON_PRODUCTS.artilink600];
  if (budget === '250') return [TOPDON_PRODUCTS.artidiag500, TOPDON_PRODUCTS.artidiag600s];
  if (budget === '400') return [TOPDON_PRODUCTS.artidiag900lite, TOPDON_PRODUCTS.artidiagpro];
  return [TOPDON_PRODUCTS.artidiagpro, TOPDON_PRODUCTS.ultradiag];
}

export default function TopdonScannerQuiz() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);

  const handleGoal = (g: Goal) => {
    setGoal(g);
    setStep(2);
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'scanner_quiz_step', { step: 'goal', value: g });
    }
  };

  const handleBudget = (b: Budget) => {
    setBudget(b);
    setStep(3);
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'scanner_quiz_step', { step: 'budget', value: b });
    }
  };

  const reset = () => {
    setStep(1);
    setGoal(null);
    setBudget(null);
  };

  const results = goal && budget ? getRecommendation(goal, budget) : [];

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-orange-500/30 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
        <h2 className="text-white font-bold text-xl">Find Your TOPDON Scanner</h2>
        <p className="text-orange-100 text-sm mt-1">Answer 2 questions — get a personalized recommendation</p>
      </div>

      <div className="p-6">
        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  s <= step
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {s === 3 ? '!' : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-0.5 ${s < step ? 'bg-orange-500' : 'bg-gray-700'}`} />
              )}
            </div>
          ))}
          <span className="ml-3 text-sm text-gray-400">
            {step === 1 && 'What do you need?'}
            {step === 2 && 'Your budget?'}
            {step === 3 && 'Your match!'}
          </span>
        </div>

        {/* Step 1: Goal */}
        {step === 1 && (
          <div className="grid sm:grid-cols-2 gap-3">
            {GOAL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleGoal(opt.value)}
                className="text-left p-4 rounded-xl border border-white/10 bg-white/5 hover:border-orange-500/60 hover:bg-orange-500/10 transition-all group"
              >
                <p className="text-white font-semibold group-hover:text-orange-400 transition-colors">
                  {opt.label}
                </p>
                <p className="text-gray-400 text-sm mt-1">{opt.desc}</p>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Budget */}
        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} className="text-orange-400 text-sm mb-4 hover:underline">
              ← Change goal
            </button>
            <div className="grid sm:grid-cols-3 gap-3">
              {BUDGET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleBudget(opt.value)}
                  className="p-4 rounded-xl border border-white/10 bg-white/5 hover:border-orange-500/60 hover:bg-orange-500/10 transition-all group"
                >
                  <p className="text-white font-bold text-lg group-hover:text-orange-400 transition-colors">
                    {opt.label}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && results.length > 0 && (
          <div>
            <button onClick={reset} className="text-orange-400 text-sm mb-4 hover:underline">
              ← Start over
            </button>
            <p className="text-white font-semibold text-lg mb-4">
              {results.length === 1
                ? 'We recommend:'
                : `Our top ${results.length} picks for you:`}
            </p>
            <div className={`grid gap-6 ${results.length > 1 ? 'md:grid-cols-2' : 'max-w-md'}`}>
              {results.map((product, i) => (
                <TopdonProductCard
                  key={product.slug}
                  product={product}
                  badge={i === 0 ? 'Top Pick' : undefined}
                  surface="scanner-quiz"
                  compact
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
