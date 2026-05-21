'use client';

import React from 'react';
import { Cpu } from 'lucide-react';

interface LlmExtractionBoxProps {
  title: string;
  data: Record<string, string | number | undefined | null>;
  className?: string;
}

export default function LlmExtractionBox({
  title,
  data,
  className = '',
}: LlmExtractionBoxProps) {
  // Filter out undefined or null values
  const entries = Object.entries(data).filter(
    ([_, val]) => val !== undefined && val !== null && String(val).trim() !== ''
  );

  if (entries.length === 0) return null;

  return (
    <aside
      className={`llm-extraction-snippet relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-[#111] to-[#0a0a0c] p-4 shadow-xl ${className}`}
      data-llm-target="true"
    >
      {/* Decorative neon ambient trace */}
      <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-cyan-500/10 blur-xl pointer-events-none" />

      <div className="flex items-center space-x-2 border-b border-white/5 pb-2.5 mb-3">
        <Cpu className="h-4 w-4 text-cyan-400" />
        <h3 className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
          Structured Spec Sheet // {title}
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {entries.map(([key, val]) => (
          <div
            key={key}
            className="flex items-center justify-between border-b border-white/[0.03] pb-1.5 font-mono text-xs"
          >
            <span className="text-gray-400 font-medium capitalize">
              {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}:
            </span>
            <span className="text-gray-200 font-bold text-right pl-4">
              {val}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}
