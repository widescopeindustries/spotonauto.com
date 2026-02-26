'use client';

import { useEffect, useState } from 'react';
import type { NHTSAData } from '@/services/nhtsaService';

interface Props {
  year: string;
  make: string;
  model: string;
}

export default function VehicleHealthSnapshot({ year, make, model }: Props) {
  const [data, setData] = useState<NHTSAData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!year || !make || !model) return;
    fetch(`/api/vehicle-health?year=${encodeURIComponent(year)}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, make, model]);

  if (loading) return null; // don't show skeleton — just silent until ready
  if (!data) return null;

  const { hasActiveRecalls, recalls, complaints } = data;
  const noIssues = !hasActiveRecalls && complaints.totalCount === 0;

  // Don't render anything if there's nothing to show
  if (noIssues) return null;

  const nhtsaUrl = `https://www.nhtsa.gov/vehicle/${encodeURIComponent(year)}/${encodeURIComponent(make.toUpperCase())}/${encodeURIComponent(model.toUpperCase())}/AWD/complaints`;

  return (
    <div className="mb-6 rounded-xl border overflow-hidden text-sm"
      style={{ borderColor: hasActiveRecalls ? 'rgba(239,68,68,0.3)' : 'rgba(251,191,36,0.2)',
               background: hasActiveRecalls ? 'rgba(239,68,68,0.06)' : 'rgba(251,191,36,0.04)' }}>

      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 border-b"
        style={{ borderColor: hasActiveRecalls ? 'rgba(239,68,68,0.2)' : 'rgba(251,191,36,0.15)' }}>
        <span className="text-base">{hasActiveRecalls ? '🚨' : '⚠️'}</span>
        <div className="flex-1 min-w-0">
          <span className="font-bold text-white">
            {hasActiveRecalls
              ? `${recalls.length} Active NHTSA Recall${recalls.length !== 1 ? 's' : ''}`
              : 'NHTSA Safety Data'}
          </span>
          {complaints.totalCount > 0 && (
            <span className="ml-2 text-xs"
              style={{ color: hasActiveRecalls ? 'rgba(252,165,165,0.8)' : 'rgba(251,191,36,0.7)' }}>
              · {complaints.totalCount} owner complaints on record
            </span>
          )}
        </div>
        <a
          href={nhtsaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs shrink-0 transition-opacity hover:opacity-100 opacity-60"
          style={{ color: hasActiveRecalls ? '#fca5a5' : '#fbbf24' }}
        >
          NHTSA ↗
        </a>
      </div>

      {/* Recall list — show first 2 */}
      {recalls.slice(0, 2).map((r, i) => (
        <div key={i} className="px-4 py-2.5 border-b last:border-b-0"
          style={{ borderColor: 'rgba(239,68,68,0.1)' }}>
          <div className="flex items-start gap-2">
            <span className="text-red-400 font-mono text-[10px] mt-0.5 shrink-0 bg-red-500/10 px-1.5 py-0.5 rounded">
              {r.nhtsaCampaignNumber}
            </span>
            <div className="min-w-0">
              <span className="font-semibold text-red-300 text-xs uppercase tracking-wide">{r.component}</span>
              <p className="text-gray-400 text-xs mt-0.5 leading-relaxed line-clamp-2">{r.summary}</p>
            </div>
          </div>
        </div>
      ))}

      {/* More recalls indicator */}
      {recalls.length > 2 && (
        <div className="px-4 py-2 text-xs text-gray-500">
          + {recalls.length - 2} more recall{recalls.length - 2 !== 1 ? 's' : ''} —{' '}
          <a href={nhtsaUrl} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline">
            view all on NHTSA.gov
          </a>
        </div>
      )}

      {/* Top complaint if no recalls */}
      {!hasActiveRecalls && complaints.mostCommonComponent && (
        <div className="px-4 py-2.5 text-xs text-amber-300/70">
          Most reported issue: <span className="text-amber-300 font-medium">{complaints.mostCommonComponent}</span>
        </div>
      )}
    </div>
  );
}
