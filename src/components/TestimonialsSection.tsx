'use client';

import { motion } from 'framer-motion';
import { DollarSign, Clock, Wrench, ShieldCheck, Zap, BookOpen } from 'lucide-react';

const TestimonialsSection = () => {
  const valueProps = [
    {
      icon: DollarSign,
      title: 'Save $200-$500 Per Repair',
      description: 'Mechanics charge $100-$150 just for diagnosis. Our AI gives you the same answer and a full repair guide.',
    },
    {
      icon: Clock,
      title: 'Results in 30 Seconds',
      description: 'No appointments, no waiting rooms, no phone tag. Enter your vehicle and problem, get answers immediately.',
    },
    {
      icon: Wrench,
      title: 'Step-by-Step Guides',
      description: 'Every guide includes tools needed, parts with prices, safety warnings, and clear instructions.',
    },
    {
      icon: ShieldCheck,
      title: 'Vehicle-Specific Data',
      description: 'Not generic advice. Guides are tailored to your exact year, make, and model with correct part numbers.',
    },
    {
      icon: Zap,
      title: 'AI Diagnostic Chat',
      description: 'Describe your symptoms in plain English. The AI asks follow-up questions to narrow down the issue.',
    },
    {
      icon: BookOpen,
      title: 'OEM Specifications',
      description: 'Torque specs, fluid capacities, belt routing diagrams, and more from factory service data.',
    },
  ];

  return (
    <section id="testimonials" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20" />

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
            Why DIY Mechanics Choose Us
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-4">
            STOP <span className="text-cyan-400">OVERPAYING</span> FOR REPAIRS
          </h2>
        </motion.div>

        {/* Cost Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass rounded-2xl p-8 border border-cyan-500/20 mb-16 max-w-2xl mx-auto"
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="font-display font-bold text-2xl text-red-400">$100-$150</div>
              <div className="font-body text-xs text-gray-500 uppercase tracking-wider mt-1">Mechanic Diagnostic</div>
            </div>
            <div className="flex items-center justify-center">
              <div className="font-body text-gray-500 text-2xl">vs.</div>
            </div>
            <div>
              <div className="font-display font-bold text-2xl text-cyan-400">FREE</div>
              <div className="font-body text-xs text-gray-500 uppercase tracking-wider mt-1">SpotOn Diagnosis</div>
            </div>
          </div>
        </motion.div>

        {/* Value Props Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {valueProps.map((prop, index) => (
            <motion.div
              key={prop.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="glass rounded-xl p-6 border border-cyan-500/10 hover:border-cyan-500/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
                <prop.icon className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="font-display font-bold text-lg text-white mb-2">
                {prop.title}
              </h3>
              <p className="font-body text-gray-400 text-sm">
                {prop.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
