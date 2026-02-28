'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, CheckCircle2, ArrowRight, Shield, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { trackUpgradeModalShown, trackUpgradeClick } from '../lib/analytics';
import { useRouter } from 'next/navigation';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthClick: () => void;
  /** Controls the headline copy shown — matches the moment of friction */
  trigger?: 'diagnosis-limit' | 'guide-limit' | 'feature-gate' | 'generic';
}

const PAYMENT_LINK = process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_LINK || 'https://buy.stripe.com/cNi14na6t8iycykeo718c08';
const FOUNDING_LINK = 'https://buy.stripe.com/cNifZh6UhaqG69Wgwf18c0f?prefilled_promo_code=FOUNDING50';

const TRIGGERS = {
  'diagnosis-limit': {
    headline: "You've used your 3 free diagnoses",
    sub: "Your car problem isn't solved yet. Pro gives you unlimited AI diagnoses — get the answer now.",
    urgency: '⚡ Most users solve their issue in the next session.',
  },
  'guide-limit': {
    headline: "Like what you see? It gets better.",
    sub: "Founding Members get 6 months of unlimited guides, AI diagnoses, and OBD-II scanning — for the price of one month.",
    urgency: '💰 Pro members save an average of $340 per repair.',
  },
  'feature-gate': {
    headline: 'Pro feature — unlock it now',
    sub: 'Get unlimited diagnostics, guides, OBD-II scanner integration, and PDF downloads.',
    urgency: '🔓 Cancel anytime. No risk.',
  },
  'generic': {
    headline: 'Unlock the full SpotOn Auto experience',
    sub: 'Unlimited AI diagnoses and repair guides for less than a coffee a week.',
    urgency: '🛡️ 14-day money-back guarantee.',
  },
};

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onAuthClick, trigger = 'generic' }) => {
  const { user } = useAuth();
  const router = useRouter();
  const content = TRIGGERS[trigger];

  useEffect(() => {
    if (isOpen) trackUpgradeModalShown();
  }, [isOpen]);

  const handleUpgrade = () => {
    trackUpgradeClick(!!user);
    if (!user) {
      onAuthClick();
      return;
    }
    // Use Founding Member link with auto-applied promo code
    const baseUrl = FOUNDING_LINK;
    const url = user.email
      ? `${baseUrl}&prefilled_email=${encodeURIComponent(user.email)}`
      : baseUrl;
    window.location.href = url;
    onClose();
  };

  const handleViewPlans = () => {
    router.push('/pricing');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upgrade-modal-title"
          >
            <div className="relative bg-[#09090f] border border-cyan-500/20 rounded-2xl p-7 shadow-2xl overflow-hidden">
              {/* Background glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-24 bg-cyan-500/10 blur-[60px] pointer-events-none" />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-600 hover:text-gray-300 transition-colors"
                aria-label="Close upgrade modal"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full mb-4">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-amber-400 text-xs font-bold tracking-wider uppercase">🔥 Founding Member Launch</span>
              </div>

              {/* Headline */}
              <h2 id="upgrade-modal-title" className="font-display font-black text-xl text-white mb-2 leading-tight">
                {content.headline}
              </h2>
              <p className="text-gray-400 text-sm mb-5 leading-relaxed">
                {content.sub}
              </p>

              {/* Founding Member Price card */}
              <div className="bg-gradient-to-b from-amber-500/5 to-transparent border border-amber-500/30 rounded-xl p-4 mb-5">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-black text-white">$9.99</span>
                  <span className="text-gray-500 text-sm line-through">$59.94</span>
                </div>
                <p className="text-amber-400 text-sm font-bold mb-3">6 months of Pro for the price of 1</p>
                <ul className="space-y-2">
                  {[
                    'Unlimited AI diagnoses',
                    'Unlimited repair guides',
                    'OBD-II scanner integration',
                    'PDF downloads & repair history',
                    '10 vehicles in your garage',
                  ].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-gray-500 mt-3">Only 47 of 50 founding spots left</p>
              </div>

              {/* Primary CTA — Founding Member */}
              <button
                onClick={handleUpgrade}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all mb-2 text-sm"
              >
                <Zap className="w-4 h-4" />
                {user ? 'Claim Founding Pro — $9.99 for 6 months' : 'Sign In to Claim'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleViewPlans}
                className="w-full py-2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
              >
                Compare all plans →
              </button>

              {/* Trust badge */}
              <div className="flex items-center justify-center gap-1.5 mt-3">
                <Shield className="w-3 h-3 text-gray-600" />
                <span className="text-[11px] text-gray-600">Cancel anytime · Full access instantly · Regular price after 6 months</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UpgradeModal;
