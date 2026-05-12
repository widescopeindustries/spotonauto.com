'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface MakeOption {
  slug: string;
  label: string;
}

interface ModelOption {
  slug: string;
  label: string;
  startYear: number;
  endYear: number;
}

interface VehicleSelectorClientProps {
  makes: MakeOption[];
  modelsByMake: Record<string, ModelOption[]>;
  allModelOptions: Array<{
    makeSlug: string;
    makeLabel: string;
    modelSlug: string;
    modelLabel: string;
    startYear: number;
    endYear: number;
  }>;
}

export default function VehicleSelectorClient({
  makes,
  modelsByMake,
  allModelOptions,
}: VehicleSelectorClientProps) {
  const router = useRouter();
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const availableModels = useMemo(() => {
    if (!selectedMake) return [];
    return modelsByMake[selectedMake] || [];
  }, [selectedMake, modelsByMake]);

  const availableYears = useMemo(() => {
    if (!selectedMake || !selectedModel) return [];
    const model = availableModels.find((m) => m.slug === selectedModel);
    if (!model) return [];
    const years: number[] = [];
    for (let y = model.endYear; y >= model.startYear; y--) {
      years.push(y);
    }
    return years;
  }, [selectedMake, selectedModel, availableModels]);

  const canNavigate = selectedMake && selectedModel && selectedYear;

  const navigate = useCallback(() => {
    if (!canNavigate) return;
    router.push(`/vehicles/${selectedYear}/${selectedMake}/${selectedModel}`);
  }, [canNavigate, selectedYear, selectedMake, selectedModel, router]);

  // Natural-language search matches
  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 3) return [];
    return allModelOptions
      .filter((opt) => {
        const text = `${opt.makeLabel} ${opt.modelLabel}`.toLowerCase();
        return text.includes(q);
      })
      .slice(0, 8);
  }, [searchQuery, allModelOptions]);

  return (
    <div className="space-y-8">
      {/* Cascading dropdowns */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <div className="grid md:grid-cols-4 gap-4 items-end">
          {/* Make */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Make
            </label>
            <select
              value={selectedMake}
              onChange={(e) => {
                setSelectedMake(e.target.value);
                setSelectedModel('');
                setSelectedYear('');
              }}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-cyan-500/40 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="" className="bg-gray-900">Select make…</option>
              {makes.map((make) => (
                <option key={make.slug} value={make.slug} className="bg-gray-900">
                  {make.label}
                </option>
              ))}
            </select>
          </div>

          {/* Model */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value);
                setSelectedYear('');
              }}
              disabled={!selectedMake}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-cyan-500/40 focus:outline-none appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="" className="bg-gray-900">Select model…</option>
              {availableModels.map((model) => (
                <option key={model.slug} value={model.slug} className="bg-gray-900">
                  {model.label}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              disabled={!selectedModel}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:border-cyan-500/40 focus:outline-none appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="" className="bg-gray-900">Select year…</option>
              {availableYears.map((year) => (
                <option key={year} value={String(year)} className="bg-gray-900">
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Go button */}
          <button
            onClick={navigate}
            disabled={!canNavigate}
            className="w-full px-6 py-3 rounded-xl bg-cyan-500 text-black font-bold hover:bg-cyan-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Go →
          </button>
        </div>
      </div>

      {/* Natural language search */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Or search by vehicle name
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="e.g. 2014 Ford Escape, Honda Civic, BMW X5…"
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:border-cyan-500/40 focus:outline-none"
          />
          {searchMatches.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-white/10 bg-gray-900 shadow-xl z-10 overflow-hidden">
              {searchMatches.map((match) => (
                <button
                  key={`${match.makeSlug}-${match.modelSlug}`}
                  onClick={() => {
                    setSelectedMake(match.makeSlug);
                    setSelectedModel(match.modelSlug);
                    setSearchQuery('');
                    // Scroll to year selector or auto-pick most recent year
                    const latestYear = match.endYear;
                    setSelectedYear(String(latestYear));
                    router.push(
                      `/vehicles/${latestYear}/${match.makeSlug}/${match.modelSlug}`,
                    );
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-white/5 transition border-b border-white/5 last:border-0"
                >
                  <span className="text-white font-medium">
                    {match.makeLabel} {match.modelLabel}
                  </span>
                  <span className="text-gray-500 text-sm ml-2">
                    {match.startYear}–{match.endYear}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-gray-600 text-xs mt-2">
          Type at least 3 characters to see matches. Click a result to go to the
          most recent model year.
        </p>
      </div>
    </div>
  );
}
