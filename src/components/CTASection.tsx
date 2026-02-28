'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowRight, Shield, Clock, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/translations';

const CTASection = () => {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const t = useT();

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h2 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-white mb-4">
            {t('cta.readyToFix')}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200 glow-text">
              {t('cta.yourRide')}
            </span>
          </h2>
          <p className="font-body text-lg text-gray-400 mb-10 max-w-xl mx-auto">
            {t('cta.joinMechanics')}
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            {/* Primary — Diagnose */}
            <motion.div
              className="relative inline-block"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 rounded-xl border-2 border-cyan-400"
                  />
                )}
              </AnimatePresence>

              <motion.button
                onClick={() => router.push('/diagnose')}
                className="relative btn-cyber-primary text-lg px-10 py-5 flex items-center gap-3 glow-button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Zap className="w-6 h-6" />
                <span className="font-display font-bold tracking-wider">
                  {isHovered ? t('cta.go') : t('cta.startDiagnosis')}
                </span>
                <ArrowRight className="w-6 h-6" />
              </motion.button>
            </motion.div>

            {/* Secondary — Guides */}
            <motion.button
              onClick={() => router.push('/guides')}
              className="flex items-center gap-2 px-8 py-5 rounded-xl border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-all font-bold text-base"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <CheckCircle2 className="w-5 h-5" />
              {t('cta.browseGuides')}
            </motion.button>
          </div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-6"
          >
            <div className="flex items-center gap-2 text-gray-400">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span className="font-body text-sm">{t('cta.freeNoSignup')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span className="font-body text-sm">{t('cta.resultsIn30s')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <CheckCircle2 className="w-5 h-5 text-cyan-400" />
              <span className="font-body text-sm">{t('cta.languagesSupported')}</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
