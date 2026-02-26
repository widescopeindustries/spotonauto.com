'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import {
  Check,
  X,
  Zap,
  Car,
  Wrench,
  Bluetooth,
  FileText,
  Headphones,
  CreditCard,
  Shield,
  ExternalLink,
  Lock
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface PricingTier {
  name: string;
  price: number;
  annualPrice?: number;
  period: string;
  description: string;
  icon: React.ReactNode;
  features: Array<{
    text: string;
    included: boolean;
  }>;
  cta: string;
  ctaAction: 'signup' | 'payment-link' | 'contact' | 'dashboard';
  paymentLink?: string;
  popular?: boolean;
}

// STRIPE PAYMENT LINKS - env vars with hardcoded fallbacks
const getPaymentLinks = () => {
  return {
    proMonthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_LINK || 'https://buy.stripe.com/cNi14na6t8iycykeo718c08',
    proAnnual: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_LINK || 'https://buy.stripe.com/9B628r5QdbuK8i44Nx18c0b',
    proPlusMonthly: process.env.NEXT_PUBLIC_STRIPE_PRO_PLUS_MONTHLY_LINK || 'https://buy.stripe.com/fZubJ192pdCS1TGeo718c09',
    proPlusAnnual: process.env.NEXT_PUBLIC_STRIPE_PRO_PLUS_ANNUAL_LINK || 'https://buy.stripe.com/3cI14n6UhbuK69Wgwf18c0a',
  };
};

const TIERS: PricingTier[] = [
  {
    name: 'DIY',
    price: 0,
    period: 'forever',
    description: 'Perfect for occasional repairs',
    icon: <Wrench className="w-6 h-6" />,
    features: [
      { text: '3 AI diagnoses per month', included: true },
      { text: '5 repair guides per month', included: true },
      { text: 'VIN decoder', included: true },
      { text: 'Basic parts finder', included: true },
      { text: '1 vehicle in garage', included: true },
      { text: 'OBD-II scanner integration', included: false },
      { text: 'PDF guide downloads', included: false },
      { text: 'Priority support', included: false },
    ],
    cta: 'Get Started Free',
    ctaAction: 'signup',
  },
  {
    name: 'Pro',
    price: 9.99,
    annualPrice: 99,
    period: 'month',
    description: 'For serious DIY mechanics',
    icon: <Zap className="w-6 h-6" />,
    features: [
      { text: 'Unlimited AI diagnoses', included: true },
      { text: 'Unlimited repair guides', included: true },
      { text: 'VIN decoder', included: true },
      { text: 'Advanced parts finder', included: true },
      { text: '10 vehicles in garage', included: true },
      { text: 'OBD-II scanner integration', included: true },
      { text: 'PDF guide downloads', included: true },
      { text: 'Priority email support', included: true },
    ],
    cta: 'Upgrade to Pro',
    ctaAction: 'payment-link',
    popular: true,
  },
  {
    name: 'Pro+',
    price: 19.99,
    annualPrice: 199,
    period: 'month',
    description: 'Professional-grade tools',
    icon: <Car className="w-6 h-6" />,
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Unlimited vehicles', included: true },
      { text: 'Live mechanic chat', included: true },
      { text: 'Video repair consultations', included: true },
      { text: 'Warranty claim assistance', included: true },
      { text: 'Shop finder with reviews', included: true },
      { text: 'Advanced diagnostics', included: true },
      { text: 'White-glove onboarding', included: true },
    ],
    cta: 'Upgrade to Pro+',
    ctaAction: 'payment-link',
    popular: false,
  },
];

const COMPARISON_FEATURES = [
  { name: 'AI Diagnoses', free: '3/month', pro: 'Unlimited', proPlus: 'Unlimited' },
  { name: 'Repair Guides', free: '5/month', pro: 'Unlimited', proPlus: 'Unlimited' },
  { name: 'Garage Vehicles', free: '1', pro: '10', proPlus: 'Unlimited' },
  { name: 'OBD-II Scanner', free: '—', pro: '✓', proPlus: '✓' },
  { name: 'PDF Downloads', free: '—', pro: '✓', proPlus: '✓' },
  { name: 'VIN Decoder', free: '✓', pro: '✓', proPlus: '✓' },
  { name: 'Parts Finder', free: 'Basic', pro: 'Advanced', proPlus: 'Advanced' },
  { name: 'Live Mechanic Chat', free: '—', pro: '—', proPlus: '✓' },
  { name: 'Video Consultations', free: '—', pro: '—', proPlus: '✓' },
  { name: 'Support', free: 'Community', pro: 'Priority Email', proPlus: '24/7 Phone' },
];

export default function PricingContent() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [user, setUser] = useState<any>(null);
  const [userTier, setUserTier] = useState('free');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Get user's current subscription
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('tier')
          .eq('user_id', user.id)
          .single();

        if (subscription) {
          setUserTier(subscription.tier);
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleCtaClick = async (tier: PricingTier) => {
    // If user is not logged in, send to auth first
    if (!user && tier.ctaAction !== 'signup') {
      router.push('/auth?redirect=/pricing');
      return;
    }

    if (tier.ctaAction === 'signup') {
      router.push('/auth');
      return;
    }

    if (tier.ctaAction === 'contact') {
      window.location.href = 'mailto:sales@spotonauto.com?subject=Pro%2B%20Inquiry';
      return;
    }

    if (tier.ctaAction === 'dashboard') {
      router.push('/history');
      return;
    }

    if (tier.ctaAction === 'payment-link') {
      // Get the correct payment link based on tier and billing period
      let paymentLink = '';

      const links = getPaymentLinks();
      if (tier.name === 'Pro') {
        paymentLink = billingPeriod === 'annual'
          ? links.proAnnual
          : links.proMonthly;
      } else if (tier.name === 'Pro+') {
        paymentLink = billingPeriod === 'annual'
          ? links.proPlusAnnual
          : links.proPlusMonthly;
      }

      if (paymentLink && paymentLink.includes('stripe.com')) {
        // Add user's email to prefill (if available)
        const url = user?.email
          ? `${paymentLink}?prefilled_email=${encodeURIComponent(user.email)}`
          : paymentLink;

        // Use location.href instead of window.open — async handlers are treated as
        // non-gesture by Chrome/Safari popup blockers, causing window.open to silently fail.
        window.location.href = url;
      } else {
        alert('Payment link not configured yet. Please check the setup instructions.');
      }
    }
  };

  // Get CTA text based on user's current tier
  const getCtaText = (tier: PricingTier) => {
    if (tier.name.toLowerCase() === userTier) {
      return 'Current Plan';
    }
    if (tier.name === 'DIY' && userTier !== 'free') {
      return 'Downgrade';
    }
    if ((tier.name === 'Pro' && userTier === 'pro_plus') ||
      (tier.name === 'Pro+' && userTier === 'pro')) {
      return 'Switch Plan';
    }
    return tier.cta;
  };

  // Determine if button should be disabled
  const isButtonDisabled = (tier: PricingTier) => {
    return tier.name.toLowerCase() === userTier;
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Choose Your Plan
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto"
          >
            Start free, upgrade when you need more power.
            Save hundreds on diagnostics and repairs.
          </motion.p>

          {/* Current Plan Badge */}
          {user && userTier !== 'free' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded-full"
            >
              <Check className="w-4 h-4 text-neon-cyan" />
              <span className="text-neon-cyan text-sm font-medium">
                You're on {userTier === 'pro' ? 'Pro' : 'Pro+'} plan
              </span>
            </motion.div>
          )}

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-4 mt-8"
          >
            <span className={`text-sm ${billingPeriod === 'monthly' ? 'text-white' : 'text-gray-500'}`}>
              Monthly
            </span>
            {/* Annual billing toggle */}
            <div className="relative group">
              <button
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
                className={`relative w-14 h-7 rounded-full p-1 transition-colors ${billingPeriod === 'annual' ? 'bg-neon-cyan' : 'bg-gray-800'}`}
              >
                <motion.div
                  className="w-5 h-5 bg-white rounded-full"
                  animate={{ x: billingPeriod === 'annual' ? 28 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
            <span className={`text-sm ${billingPeriod === 'annual' ? 'text-white' : 'text-gray-500'}`}>
              Annual
              <span className="ml-2 text-xs bg-neon-cyan/20 text-neon-cyan px-2 py-0.5 rounded-full border border-neon-cyan/30">
                Save 20%
              </span>
            </span>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {TIERS.map((tier, idx) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              className={`relative rounded-2xl overflow-hidden ${tier.popular
                ? 'bg-gradient-to-b from-neon-cyan/20 to-black border-2 border-neon-cyan'
                : 'bg-gray-900/50 border border-gray-800'
                } ${isButtonDisabled(tier) ? 'opacity-75' : ''}`}
            >
              {tier.popular && (
                <div className="absolute top-0 left-0 right-0 bg-neon-cyan text-black text-center text-sm font-bold py-1">
                  MOST POPULAR
                </div>
              )}

              <div className="p-8 pt-10">
                {/* Tier Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${tier.popular ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-gray-800 text-gray-400'}`}>
                    {tier.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white">{tier.name}</h3>
                </div>

                <p className="text-gray-400 mb-6">{tier.description}</p>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-white">
                      ${billingPeriod === 'annual' && tier.annualPrice ? tier.annualPrice : tier.price}
                    </span>
                    <span className="text-gray-500">/{billingPeriod === 'annual' && tier.price > 0 ? 'year' : tier.period}</span>
                  </div>
                  {billingPeriod === 'annual' && tier.annualPrice && tier.price > 0 && (
                    <p className="text-sm text-neon-cyan mt-1">
                      Save ${((tier.price * 12) - tier.annualPrice).toFixed(0)}/year
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleCtaClick(tier)}
                  disabled={isButtonDisabled(tier)}
                  className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isButtonDisabled(tier)
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : tier.popular
                      ? 'bg-neon-cyan text-black hover:bg-cyan-400'
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                    }`}
                >
                  {getCtaText(tier)}
                  {!isButtonDisabled(tier) && tier.ctaAction === 'payment-link' && <ExternalLink className="w-4 h-4" />}
                  {isButtonDisabled(tier) && <Check className="w-4 h-4" />}
                </button>

                {/* Features */}
                <ul className="mt-8 space-y-4">
                  {tier.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-neon-cyan flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? 'text-gray-300' : 'text-gray-500'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Setup Notice (Only show if payment links not configured) */}
        {!getPaymentLinks().proMonthly && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 mb-16"
          >
            <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
              ⚠️ Developer Notice: Payment Links Not Configured
            </h3>
            <p className="text-gray-300 mb-4">
              You need to create Payment Links in your Stripe Dashboard:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-400 text-sm">
              <li>Go to <a href="https://dashboard.stripe.com/payment-links" target="_blank" rel="noopener" className="text-neon-cyan underline">Stripe Payment Links</a></li>
              <li>Create products for Pro ($9.99/mo) and Pro+ ($19.99/mo)</li>
              <li>Create both monthly and annual pricing options</li>
              <li>Copy the payment link URLs to your environment variables</li>
            </ol>
            <p className="text-gray-400 text-sm mt-4">
              See <code className="bg-gray-800 px-2 py-1 rounded">STRIPE_PAYMENT_LINKS_SETUP.md</code> for detailed instructions.
            </p>
          </motion.div>
        )}

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-900/30 border border-gray-800 rounded-2xl overflow-hidden mb-16"
        >
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-2xl font-bold text-white">Compare Plans</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left p-4 text-gray-400 font-medium">Feature</th>
                  <th className="text-center p-4 text-gray-400 font-medium">DIY</th>
                  <th className="text-center p-4 text-neon-cyan font-medium">Pro</th>
                  <th className="text-center p-4 text-gray-400 font-medium">Pro+</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((feature, idx) => (
                  <tr key={idx} className="border-b border-gray-800/50 last:border-0">
                    <td className="p-4 text-gray-300">{feature.name}</td>
                    <td className="p-4 text-center text-gray-500">{feature.free}</td>
                    <td className="p-4 text-center text-white font-medium">{feature.pro}</td>
                    <td className="p-4 text-center text-gray-300">{feature.proPlus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid md:grid-cols-2 gap-8 mb-16"
        >
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Can I cancel anytime?</h3>
            <p className="text-gray-400">
              Yes! You can cancel your subscription at any time. You'll continue to have access
              until the end of your billing period. No questions asked.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-4">What OBD scanners work?</h3>
            <p className="text-gray-400">
              We support most Bluetooth ELM327 adapters including BlueDriver, FIXD, Veepeak,
              and generic adapters. The scanner must support Bluetooth Low Energy (BLE).
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Is my data private?</h3>
            <p className="text-gray-400">
              Absolutely. Your diagnostic data and vehicle information is encrypted and never
              sold to third parties. We only use it to provide you with better repair guidance.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Do you offer refunds?</h3>
            <p className="text-gray-400">
              We offer a 14-day money-back guarantee. If you're not satisfied with Pro,
              contact us for a full refund. No hassle, no hoops to jump through.
            </p>
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-wrap items-center justify-center gap-8 text-gray-500"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="text-sm">Secure SSL Checkout</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            <span className="text-sm">All Major Cards Accepted</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <span className="text-sm">14-Day Money Back</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            <span className="text-sm">256-bit Encryption</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
