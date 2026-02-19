'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trackUpgradeModalShown, trackUpgradeClick } from '@/lib/analytics';
import { useAuth } from '@/contexts/AuthContext';

// Direct Stripe payment link (same source as UpgradeModal + PricingContent)
const PRO_MONTHLY_LINK =
  process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_LINK ||
  'https://buy.stripe.com/cNi14na6t8iycykeo718c08';

interface UpgradeGateProps {
  type: 'guide' | 'diagnosis';
  used: number;
  limit: number;
}

export default function UpgradeGate({ type, used, limit }: UpgradeGateProps) {
  const router = useRouter();
  const { user } = useAuth();
  const typeLabel = type === 'guide' ? 'repair guides' : 'diagnoses';

  useEffect(() => {
    trackUpgradeModalShown();
  }, []);

  const handleUpgrade = () => {
    trackUpgradeClick(!!user);

    // If user is not logged in, send to auth first, then return to current page
    if (!user) {
      const returnUrl = typeof window !== 'undefined' ? window.location.pathname : '/';
      router.push(`/auth?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // User is logged in — go directly to Stripe checkout (3 steps: click → Stripe → done)
    const url = user.email
      ? `${PRO_MONTHLY_LINK}?prefilled_email=${encodeURIComponent(user.email)}`
      : PRO_MONTHLY_LINK;
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-lg mx-auto my-12 p-8 text-center">
      {/* Limit badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 mb-6">
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        <span className="font-mono text-xs text-amber-400 uppercase tracking-wider">Free Limit Reached</span>
      </div>

      <h2 className="text-2xl font-bold text-white mb-3">
        You&apos;ve used all {limit} free {typeLabel} this month
      </h2>
      <p className="text-gray-400 mb-8 max-w-md mx-auto">
        Upgrade to Pro for unlimited {typeLabel} and save hundreds on your next repair.
      </p>

      {/* Usage meter */}
      <div className="max-w-xs mx-auto mb-8">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Monthly {typeLabel}</span>
          <span>{used}/{limit} used</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full" style={{ width: '100%' }} />
        </div>
      </div>

      {/* Value props */}
      <div className="grid grid-cols-2 gap-3 mb-8 text-left max-w-sm mx-auto">
        {[
          'Unlimited repair guides',
          'Unlimited AI diagnoses',
          'OBD-II scanner support',
          'PDF guide downloads',
        ].map((feature, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-cyan-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-300">{feature}</span>
          </div>
        ))}
      </div>

      {/* CTA — directly opens Stripe checkout for logged-in users */}
      <button
        onClick={handleUpgrade}
        className="px-8 py-4 rounded-lg font-bold text-sm tracking-wider uppercase bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(0,212,255,0.4)] transition-all mb-3"
      >
        {user ? 'UPGRADE TO PRO — $9.99/mo' : 'SIGN IN TO UPGRADE'}
      </button>

      <p className="text-gray-600 text-xs mt-4">
        14-day money-back guarantee. Cancel anytime.
      </p>

      {/* Note: the static SSR content above this component still shows for SEO */}
      <p className="text-gray-700 text-xs mt-6 border-t border-white/5 pt-4">
        The basic overview above is always free. The detailed AI guide with exact part numbers and torque specs requires Pro.
      </p>
    </div>
  );
}
