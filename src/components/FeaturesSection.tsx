'use client';

import { motion } from 'framer-motion';
import { Activity, Zap, BookOpen } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    {
      icon: Activity,
      title: '98.4% Accuracy',
      description: 'Trained on millions of repair records and factory service manuals for precise diagnostics.',
      stat: '10M+',
      statLabel: 'Repairs Analyzed',
    },
    {
      icon: Zap,
      title: 'Instant Results',
      description: "No waiting for a mechanic's opinion. Get AI-powered diagnoses in under 30 seconds.",
      stat: '<30s',
      statLabel: 'Avg. Response',
    },
    {
      icon: BookOpen,
      title: 'Factory Manuals',
      description: 'Access OEM specifications, torque values, and step-by-step procedures instantly.',
      stat: '50K+',
      statLabel: 'Manuals Available',
    },
  ];

  return (
    <section id="features" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-30" />

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
            Why Choose Us
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-4">
            WHY <span className="text-cyan-400">SPOTON</span> AUTO?
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto" />
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className="group"
            >
              <div className="glass rounded-2xl p-8 h-full card-hover border border-cyan-500/10 hover:border-cyan-500/30 transition-all duration-500">
                {/* Icon */}
                <div className="relative w-16 h-16 mb-6">
                  <div className="absolute inset-0 bg-cyan-500/20 rounded-xl rotate-6 group-hover:rotate-12 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-cyan-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <feature.icon className="w-8 h-8 text-cyan-400" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-display font-bold text-xl text-white mb-3">
                  {feature.title}
                </h3>
                <p className="font-body text-gray-400 mb-6">
                  {feature.description}
                </p>

                {/* Stat */}
                <div className="flex items-center gap-2 pt-4 border-t border-cyan-500/10">
                  <span className="font-display font-bold text-2xl text-cyan-400">
                    {feature.stat}
                  </span>
                  <span className="font-body text-xs text-gray-500 uppercase tracking-wider">
                    {feature.statLabel}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
