import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Wrench, BookOpen, Shield, ChevronRight, CheckCircle } from 'lucide-react';
import SEOHead from '../components/seo/SEOHead';
import { COMMON_MAKES, getYears, fetchModels } from '../services/vehicleData';
import { Analytics } from '../services/analytics';

const CELLandingPage: React.FC = () => {
  const navigate = useNavigate();

  // Vehicle form state
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [symptom, setSymptom] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const years = getYears();

  // Track page view on mount
  useEffect(() => {
    Analytics.celPageView();
  }, []);

  // Fetch models when make/year change
  useEffect(() => {
    if (make && year) {
      setLoadingModels(true);
      fetchModels(make, year)
        .then(m => { setModels(m); setLoadingModels(false); })
        .catch(() => setLoadingModels(false));
    } else {
      setModels([]);
    }
  }, [make, year]);

  // Track vehicle selection
  useEffect(() => {
    if (make && model && year) {
      Analytics.vehicleSelected(make, model, year);
    }
  }, [make, model, year]);

  const handleDiagnose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!make || !model || !year || !symptom) return;

    Analytics.diagnoseClicked({ year, make, model }, symptom);
    navigate(`/repair/${year}/${make}/${model}/${symptom.replace(/\s+/g, '-')}`, {
      state: { fromCEL: true }
    });
  };

  const scrollToForm = () => {
    document.getElementById('cel-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const isFormReady = make && model && year && symptom;

  return (
    <>
      <SEOHead
        title="Check Engine Light On? Free AI Diagnosis | SpotOn Auto"
        description="Your check engine light is on. Get a free AI-powered diagnosis in 30 seconds. Step-by-step repair guides for your exact vehicle. No mechanic needed."
        keywords="check engine light, CEL diagnosis, car diagnostic, DIY auto repair, OBD code, P0420, engine light on"
        canonicalUrl="https://spotonauto.com/cel"
      />

      <div className="min-h-screen bg-brand-black text-gray-200">

        {/* ==================== HERO ==================== */}
        <section className="relative overflow-hidden pt-8 pb-16 md:pt-16 md:pb-24 px-4">
          {/* Background effects */}
          <div className="absolute inset-0 bg-cyber-grid bg-grid-sm opacity-10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-neon-purple/15 to-transparent blur-3xl rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-radial from-brand-cyan/15 to-transparent blur-3xl rounded-full"></div>

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-brand-cyan/10 border border-brand-cyan/30 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 bg-brand-cyan rounded-full animate-pulse"></span>
                <span className="text-brand-cyan text-xs font-mono uppercase tracking-wider">AI Diagnostic Engine Online</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight uppercase">
                Your Check Engine Light Is On.{' '}
                <span className="text-brand-cyan">Let's Fix It.</span>
              </h1>

              <p className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-mono">
                Free AI diagnosis in 30 seconds. Step-by-step repair guide for your exact vehicle. No mechanic needed.
              </p>

              {/* Trust signals */}
              <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-500 font-mono">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-neon-green" />
                  No credit card
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-neon-green" />
                  Results in 30s
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-neon-green" />
                  Works on any vehicle
                </span>
              </div>

              {/* CTA to form */}
              <button
                onClick={scrollToForm}
                className="mt-10 inline-flex items-center gap-2 bg-brand-cyan hover:bg-brand-cyan-light text-black font-bold py-4 px-10 rounded-xl shadow-glow-cyan transition-all transform hover:scale-105 active:scale-95 text-lg font-mono uppercase tracking-wide"
              >
                <Zap className="w-5 h-5" />
                Diagnose Now — Free
              </button>
            </motion.div>
          </div>
        </section>

        {/* ==================== HOW IT WORKS ==================== */}
        <section className="py-16 px-4 border-t border-white/5">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center text-2xl md:text-3xl font-bold text-white uppercase tracking-wide mb-12">
              How It Works
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  icon: <Wrench className="w-8 h-8" />,
                  title: 'Enter Your Vehicle',
                  desc: 'Select your year, make, and model. We pull factory specs for your exact car.'
                },
                {
                  step: '02',
                  icon: <Zap className="w-8 h-8" />,
                  title: 'Describe the Issue',
                  desc: 'Tell us the symptom, OBD code, or what\'s going wrong. Our AI cross-references millions of repairs.'
                },
                {
                  step: '03',
                  icon: <BookOpen className="w-8 h-8" />,
                  title: 'Get Your Fix',
                  desc: 'Receive a step-by-step repair guide with tools, parts, and difficulty rating. Fix it yourself and save.'
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="bg-glass-dark backdrop-blur border border-white/10 rounded-2xl p-8 text-center group hover:border-brand-cyan/30 transition-all"
                >
                  <div className="text-brand-cyan/30 text-5xl font-bold font-mono mb-4">{item.step}</div>
                  <div className="text-brand-cyan mb-4 flex justify-center group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2 uppercase tracking-wide">{item.title}</h3>
                  <p className="text-gray-400 text-sm font-mono leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== VEHICLE FORM ==================== */}
        <section id="cel-form" className="py-16 px-4 border-t border-white/5 scroll-mt-20">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-glass-dark backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-glass-premium"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-wide">
                  Start Your <span className="text-brand-cyan">Free Diagnosis</span>
                </h2>
                <p className="text-gray-400 text-sm font-mono mt-2">Takes 30 seconds. No account required.</p>
              </div>

              <form onSubmit={handleDiagnose} className="space-y-5">
                {/* Year */}
                <div className="relative">
                  <label htmlFor="cel-year" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 font-mono">Year</label>
                  <select
                    id="cel-year"
                    value={year}
                    onChange={(e) => { setYear(e.target.value); setModel(''); }}
                    className="w-full bg-gray-900/60 border border-gray-700 rounded-xl px-4 py-3.5 text-gray-200 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all text-sm font-medium appearance-none"
                  >
                    <option value="">Select Year</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                {/* Make */}
                <div className="relative">
                  <label htmlFor="cel-make" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 font-mono">Make</label>
                  <select
                    id="cel-make"
                    value={make}
                    onChange={(e) => { setMake(e.target.value); setModel(''); }}
                    disabled={!year}
                    className="w-full bg-gray-900/60 border border-gray-700 rounded-xl px-4 py-3.5 text-gray-200 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all text-sm font-medium appearance-none disabled:opacity-50"
                  >
                    <option value="">Select Make</option>
                    {COMMON_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                {/* Model */}
                <div className="relative">
                  <label htmlFor="cel-model" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 font-mono">Model</label>
                  <select
                    id="cel-model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    disabled={!make || loadingModels}
                    className="w-full bg-gray-900/60 border border-gray-700 rounded-xl px-4 py-3.5 text-gray-200 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all text-sm font-medium appearance-none disabled:opacity-50"
                  >
                    <option value="">{loadingModels ? 'Loading models...' : 'Select Model'}</option>
                    {models.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                {/* Symptom */}
                <div className="relative">
                  <label htmlFor="cel-symptom" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 font-mono">What's Wrong?</label>
                  <input
                    id="cel-symptom"
                    type="text"
                    placeholder="e.g. Check engine light on, P0420 code, squeaky brakes..."
                    value={symptom}
                    onChange={(e) => setSymptom(e.target.value)}
                    onBlur={() => { if (symptom) Analytics.symptomEntered(symptom); }}
                    className="w-full bg-gray-900/60 border border-gray-700 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all text-sm"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!isFormReady}
                  className="w-full mt-4 bg-brand-cyan hover:bg-brand-cyan-light text-black font-bold py-4 rounded-xl shadow-glow-cyan transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none text-lg font-mono uppercase tracking-wide flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  Get My Free Diagnosis
                  <ChevronRight className="w-5 h-5" />
                </button>

                <p className="text-center text-xs text-gray-600 font-mono mt-3">
                  No signup required. Your first diagnosis is completely free.
                </p>
              </form>
            </motion.div>
          </div>
        </section>

        {/* ==================== SAVINGS SECTION ==================== */}
        <section className="py-16 px-4 border-t border-white/5">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-wide mb-4">
                Save <span className="text-brand-cyan">$200–$500</span> Per Repair
              </h2>
              <p className="text-gray-400 font-mono max-w-2xl mx-auto mb-12">
                Mechanics charge $100–$150 just to diagnose the problem. Then they mark up parts 50–100%.
                Our AI gives you the same diagnosis for free, and links you to parts at retail price.
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { label: 'Mechanic Diagnostic', cost: '$100–$150', color: 'text-red-400', sub: 'Just to tell you what\'s wrong' },
                  { label: 'SpotOn Diagnosis', cost: 'FREE', color: 'text-brand-cyan', sub: 'Same answer, 30 seconds' },
                  { label: 'Average Savings', cost: '$347', color: 'text-neon-green', sub: 'Per repair vs. shop prices' },
                ].map((item, i) => (
                  <div key={i} className="bg-glass-dark border border-white/10 rounded-2xl p-6">
                    <p className="text-gray-500 text-xs font-mono uppercase tracking-wider mb-2">{item.label}</p>
                    <p className={`text-3xl font-bold ${item.color} font-mono`}>{item.cost}</p>
                    <p className="text-gray-500 text-xs font-mono mt-2">{item.sub}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={scrollToForm}
                className="mt-12 inline-flex items-center gap-2 bg-brand-cyan hover:bg-brand-cyan-light text-black font-bold py-4 px-10 rounded-xl shadow-glow-cyan transition-all transform hover:scale-105 active:scale-95 text-lg font-mono uppercase tracking-wide"
              >
                Start Free Diagnosis
              </button>
            </motion.div>
          </div>
        </section>

        {/* ==================== FAQ ==================== */}
        <section className="py-16 px-4 border-t border-white/5">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-center text-2xl md:text-3xl font-bold text-white uppercase tracking-wide mb-12">
              Common Questions
            </h2>

            <div className="space-y-4">
              {[
                {
                  q: 'How does the AI know what\'s wrong with my car?',
                  a: 'Our AI cross-references your vehicle\'s factory service data, known issues, technical service bulletins, and millions of documented repairs to identify the most likely cause and fix.'
                },
                {
                  q: 'Will this work on my specific vehicle?',
                  a: 'We support virtually every make and model from 1980 to 2027. Our vehicle database pulls directly from the NHTSA, so if your car is registered in the US, we can diagnose it.'
                },
                {
                  q: 'Is it really free?',
                  a: 'Your first diagnosis is 100% free, no credit card required. Premium members get unlimited diagnoses and saved repair history for $10.99/month.'
                },
                {
                  q: 'What if the AI gets it wrong?',
                  a: 'Our guides always include multiple possible causes ranked by likelihood, safety warnings, and when to seek professional help. We never recommend a fix without explaining the reasoning.'
                },
                {
                  q: 'I\'m not a mechanic. Can I actually do this?',
                  a: 'Every guide includes a difficulty rating, estimated time, required tools, and step-by-step instructions with images. Many repairs are simpler than you think — brake pads, air filters, and spark plugs are common first-timer wins.'
                },
              ].map((item, i) => (
                <details key={i} className="group bg-glass-dark border border-white/10 rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between cursor-pointer p-6 text-white font-bold text-sm uppercase tracking-wide hover:text-brand-cyan transition-colors">
                    {item.q}
                    <ChevronRight className="w-5 h-5 text-gray-500 group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="px-6 pb-6 text-gray-400 text-sm font-mono leading-relaxed">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== FINAL CTA ==================== */}
        <section className="py-20 px-4 border-t border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial from-brand-cyan/5 to-transparent"></div>
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-wide mb-4">
              Stop Guessing. <span className="text-brand-cyan">Start Fixing.</span>
            </h2>
            <p className="text-gray-400 font-mono mb-8">
              Your check engine light won't turn itself off. Get answers in 30 seconds.
            </p>
            <button
              onClick={scrollToForm}
              className="inline-flex items-center gap-2 bg-brand-cyan hover:bg-brand-cyan-light text-black font-bold py-4 px-10 rounded-xl shadow-glow-cyan transition-all transform hover:scale-105 active:scale-95 text-lg font-mono uppercase tracking-wide"
            >
              <Zap className="w-5 h-5" />
              Diagnose Now — Free
            </button>
          </div>
        </section>

        {/* ==================== MINIMAL FOOTER ==================== */}
        <footer className="py-8 px-4 border-t border-white/5 text-center">
          <p className="text-gray-600 text-xs font-mono">
            &copy; {new Date().getFullYear()} SpotOn Auto. All rights reserved.
            {' '}&middot;{' '}
            <a href="/privacy" className="hover:text-brand-cyan transition-colors">Privacy</a>
            {' '}&middot;{' '}
            <a href="/terms" className="hover:text-brand-cyan transition-colors">Terms</a>
          </p>
        </footer>
      </div>
    </>
  );
};

export default CELLandingPage;
