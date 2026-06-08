'use client';

import React from 'react';
import { Wrench, ArrowRight, MapPin, Clock, ShieldCheck } from 'lucide-react';

interface MobileMechanicCTAProps {
  className?: string;
  vehicle?: string;
  context?: 'repair_page' | 'diagnose' | 'second_opinion' | 'wiring' | 'symptom';
}

const MECHANIC_URL = process.env.NEXT_PUBLIC_MOBILE_MECHANIC_URL || 'https://www.yourmechanic.com/book';

export default function MobileMechanicCTA({
  className = '',
  vehicle = 'your vehicle',
  context = 'repair_page',
}: MobileMechanicCTAProps) {
  const handleClick = () => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'mechanic_lead_click', {
        event_category: 'lead_gen',
        event_label: context,
        vehicle: vehicle,
        value: 15,
      });
    }
  };

  const headlines: Record<string, string> = {
    repair_page: `Rather have a pro handle this?`,
    diagnose: `Not sure you want to DIY the fix?`,
    second_opinion: `Want a second opinion from a real mechanic?`,
    wiring: `Electrical issues are tricky — get pro help`,
    symptom: `Let a certified mechanic diagnose it at your home`,
  };

  return (
    <div className={`rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.08] to-blue-500/[0.04] p-5 sm:p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20">
          <Wrench className="h-5 w-5 text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-cyan-100">
            {headlines[context] || headlines.repair_page}
          </h3>
          <p className="mt-1 text-xs text-cyan-50/70 leading-relaxed">
            A certified mobile mechanic comes to your home or office. They bring the tools, you stay comfortable. 
            No tow truck, no waiting room, no surprises.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-cyan-200/80 border border-white/10">
              <MapPin className="h-3 w-3" />
              Comes to you
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-cyan-200/80 border border-white/10">
              <Clock className="h-3 w-3" />
              Same-day available
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[10px] text-cyan-200/80 border border-white/10">
              <ShieldCheck className="h-3 w-3" />
              12-month warranty
            </span>
          </div>

          <a
            href={MECHANIC_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-bold text-black transition hover:bg-cyan-300"
          >
            Get a Free Quote
            <ArrowRight className="h-4 w-4" />
          </a>
          <p className="mt-2 text-[10px] text-cyan-200/50">
            No obligation. See pricing before you book.
          </p>
        </div>
      </div>
    </div>
  );
}
