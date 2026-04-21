'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

import { trackPricingCtaClick, trackPricingView } from '@/lib/analytics';

type PricingTarget = 'starter_free' | 'pro_checkout' | 'pro_waitlist';

interface PricingTrackedLinkProps {
  href: string;
  target: PricingTarget;
  label: string;
  className?: string;
  children: ReactNode;
}

export function PricingViewTracker() {
  useEffect(() => {
    trackPricingView();
  }, []);

  return null;
}

export function PricingTrackedLink({ href, target, label, className, children }: PricingTrackedLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => trackPricingCtaClick(target, label)}
    >
      {children}
    </Link>
  );
}

