'use client';

import { motion } from 'framer-motion';
import { Car, Activity, Cpu, Wrench } from 'lucide-react';

const HowItWorksSection = () => {
  const steps = [
    {
      number: '01',
      title: 'IDENTIFY',
      description: 'Enter your VIN or select your vehicle make, model, and year from our comprehensive database.',
      icon: Car,
    },
    {
      number: '02',
      title: 'DESCRIBE',
      description: "Tell us the symptoms you're experiencing. The more details, the better the diagnosis.",
      icon: Activity,
    },
    {
      number: '03',
      title: 'DIAGNOSE',
      description: 'Our AI analyzes millions of repair records to identify the most likely cause.',
      icon: Cpu,
    },
    {
      number: '04',
      title: 'REPAIR',
      description: 'Get your step-by-step repair guide with parts list, tools needed, and estimated time.',
      icon: Wrench,
    },
  ];

  return (
    <section id="how-it-works" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 hex-pattern opacity-20" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[200px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="font-body text-xs tracking-[0.3em] text-cyan-400 uppercase mb-4 block">
            The Process
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-4">
            HOW IT <span className="text-cyan-400">WORKS</span>
          </h2>
          <p className="font-body text-gray-400 max-w-2xl mx-auto">
            From diagnosis to repair in four simple steps. Our AI guides you through the entire process.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              className="relative"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-px">
                  <div className="w-full h-full bg-gradient-to-r from-cyan-500/50 to-transparent" />
                  <motion.div
                    initial={{ x: '-100%' }}
                    whileInView={{ x: '100%' }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.3 + 0.5, duration: 1 }}
                    className="absolute top-0 left-0 w-4 h-full bg-cyan-400 blur-sm"
                  />
                </div>
              )}

              <div className="glass rounded-2xl p-6 h-full border border-cyan-500/10 hover:border-cyan-500/30 transition-all duration-500 group">
                {/* Step Number */}
                <div className="flex items-center justify-between mb-6">
                  <span className="font-display font-black text-4xl text-cyan-400/30 group-hover:text-cyan-400/60 transition-colors animate-text-flicker">
                    {step.number}
                  </span>
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                    <step.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-display font-bold text-lg text-white mb-2">
                  {step.title}
                </h3>
                <p className="font-body text-sm text-gray-400">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
