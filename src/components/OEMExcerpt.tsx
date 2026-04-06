'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { OEMExcerptData } from '@/lib/manualSectionLinks';

interface OEMExcerptProps {
  excerpts: OEMExcerptData[];
  vehicleName: string;
  task: string;
}

function ExcerptCard({ excerpt }: { excerpt: OEMExcerptData }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = excerpt.contentPreview.length > 300;
  const displayText = expanded || !isLong
    ? excerpt.contentPreview
    : excerpt.contentPreview.slice(0, 300).replace(/\s+\S*$/, '') + '...';

  // Extract the most specific part of the section title from the path
  const pathParts = excerpt.path.split('/').filter(Boolean);
  const variant = pathParts.length >= 3 ? pathParts[2] : '';

  return (
    <div className="rounded-xl border border-emerald-500/15 bg-emerald-950/20 p-4 md:p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h4 className="text-base font-semibold text-white tracking-tight leading-snug">
            {excerpt.sectionTitle}
          </h4>
          {variant && (
            <span className="mt-1.5 inline-block rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300/80">
              {variant}
            </span>
          )}
        </div>
        <svg className="h-4 w-4 shrink-0 text-emerald-500/40 mt-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      </div>

      <p className="text-sm leading-7 text-gray-300/90">
        {displayText}
      </p>

      <div className="mt-3 flex items-center gap-4">
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-medium text-emerald-400/70 hover:text-emerald-300 transition-colors"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
        <Link
          href={excerpt.manualHref}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Open full OEM section
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export default function OEMExcerpt({ excerpts, vehicleName, task }: OEMExcerptProps) {
  if (excerpts.length === 0) return null;

  const cleanTask = task.replace(/-/g, ' ');

  return (
    <section className="mb-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-6 md:p-7">
      <div className="flex items-center gap-2.5 mb-1">
        <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
          Factory Service Manual
        </p>
      </div>
      <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-white mt-2">
        What the OEM says about {cleanTask}
      </h3>
      <p className="mt-2 text-sm leading-6 text-gray-400 max-w-2xl">
        These excerpts come directly from the factory service manual for the {vehicleName}. This is what the manufacturer wrote for certified technicians.
      </p>

      <div className="mt-5 space-y-3">
        {excerpts.map((excerpt) => (
          <ExcerptCard key={excerpt.path} excerpt={excerpt} />
        ))}
      </div>
    </section>
  );
}
