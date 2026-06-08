/**
 * Sticky affiliate CTA bar for high-intent pages.
 *
 * Shows after the user scrolls past the hero, giving them a persistent
 * one-click path to Amazon parts/tools without scrolling back up.
 *
 * Designed for mobile-first: compact, dismissible, high contrast.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { X, ShoppingCart, Wrench, ArrowRight } from 'lucide-react';
import AffiliateLink from './AffiliateLink';
import { buildAmazonSearchUrl } from '@/lib/amazonAffiliate';

interface StickyAffiliateBarProps {
  /** Vehicle name, e.g. "2010 Toyota Camry" */
  vehicle: string;
  /** What the user is looking for, e.g. "Oil Change" or "Spark Plugs" */
  intent: string;
  /** Optional specific query to search Amazon for. Defaults to "{vehicle} {intent}" */
  query?: string;
  /** Analytics subtag */
  subtag?: string;
  /** When to show the bar: px scrolled. Default 400. */
  showAfter?: number;
  /** Optional className for custom positioning */
  className?: string;
  /** Variant: parts (default) | tools | mixed */
  variant?: 'parts' | 'tools' | 'mixed';
}

export default function StickyAffiliateBar({
  vehicle,
  intent,
  query,
  subtag = 'sticky-bar',
  showAfter = 400,
  className = '',
  variant = 'parts',
}: StickyAffiliateBarProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    const onScroll = () => {
      const scrolled = window.scrollY || document.documentElement.scrollTop || 0;
      setVisible(scrolled > showAfter);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, [dismissed, showAfter]);

  if (dismissed || !visible) return null;

  const searchQuery = query || `${vehicle} ${intent}`;
  const href = buildAmazonSearchUrl(searchQuery, 'automotive', subtag);

  const variantMeta = {
    parts: {
      icon: <ShoppingCart className="h-4 w-4" />,
      label: 'Get parts',
      color: 'amber',
      gradient: 'from-amber-500 to-orange-500',
    },
    tools: {
      icon: <Wrench className="h-4 w-4" />,
      label: 'Get tools',
      color: 'cyan',
      gradient: 'from-cyan-500 to-blue-500',
    },
    mixed: {
      icon: <ShoppingCart className="h-4 w-4" />,
      label: 'Get parts & tools',
      color: 'amber',
      gradient: 'from-amber-500 to-orange-500',
    },
  }[variant];

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-50 px-3 py-3
        bg-[#0a0a0c]/95 backdrop-blur-xl border-t border-white/10
        shadow-[0_-8px_32px_rgba(0,0,0,0.4)]
        animate-in slide-in-from-bottom-4 duration-300
        ${className}
      `}
    >
      <div className="max-w-6xl mx-auto flex items-center gap-3">
        {/* Icon */}
        <div
          className={`
            hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl
            bg-${variantMeta.color}-500/10 text-${variantMeta.color}-400
            border border-${variantMeta.color}-500/30
          `}
        >
          {variantMeta.icon}
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">
            {variantMeta.label} for {vehicle}
          </p>
          <p className="text-xs text-gray-400 truncate">
            Amazon search: {intent.toLowerCase()}
          </p>
        </div>

        {/* CTA */}
        <AffiliateLink
          href={href}
          partName={`${vehicle} ${intent}`}
          vehicle={vehicle}
          pageType="parts_page"
          subtag={subtag}
          className={`
            shrink-0 inline-flex items-center gap-2
            px-4 py-2.5 rounded-lg
            bg-gradient-to-r ${variantMeta.gradient}
            text-black text-sm font-bold
            shadow-lg hover:shadow-xl
            transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]
          `}
        >
          <span className="hidden sm:inline">Shop Amazon</span>
          <span className="sm:hidden">Shop</span>
          <ArrowRight className="h-4 w-4" />
        </AffiliateLink>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 p-2 text-gray-500 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
