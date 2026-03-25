'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface DtcCodeEntry {
  code: string;
  title: string;
  system: string;
}

interface SystemEntry {
  name: string;
  slug: string;
  dtcCount: number;
  procedureCount: number;
  diagramCount: number;
  totalCount: number;
}

interface VehicleLaneClientProps {
  displayName: string;
  basePath: string;
  diagnosePath: string;
  dtcCodes: DtcCodeEntry[];
  systems: SystemEntry[];
}

export default function VehicleLaneClient({
  displayName,
  basePath,
  diagnosePath,
  dtcCodes,
  systems,
}: VehicleLaneClientProps) {
  const [codeSearch, setCodeSearch] = useState('');
  const [selectedSystem, setSelectedSystem] = useState('all');

  // Filter codes by search and system
  const filteredCodes = useMemo(() => {
    let codes = dtcCodes;
    if (selectedSystem !== 'all') {
      codes = codes.filter((c) => c.system === selectedSystem);
    }
    if (codeSearch.trim()) {
      const q = codeSearch.trim().toUpperCase();
      codes = codes.filter(
        (c) =>
          c.code.includes(q) ||
          c.title.toUpperCase().includes(q) ||
          c.system.toUpperCase().includes(q),
      );
    }
    return codes;
  }, [dtcCodes, codeSearch, selectedSystem]);

  // Systems that have DTC codes
  const dtcSystems = useMemo(
    () => systems.filter((s) => s.dtcCount > 0).sort((a, b) => b.dtcCount - a.dtcCount),
    [systems],
  );

  return (
    <>
      {/* Two-path entry */}
      <div className="grid md:grid-cols-2 gap-4 mb-10">
        {/* Path A: I have a code */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-6">
          <h2 className="text-lg font-bold text-white mb-2">I have a code</h2>
          <p className="text-gray-400 text-sm mb-4">
            Enter your DTC code to see the factory diagnostic procedure for your {displayName}.
          </p>
          <div className="relative">
            <input
              type="text"
              value={codeSearch}
              onChange={(e) => setCodeSearch(e.target.value)}
              placeholder="Type a code (e.g. P0420)"
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:border-amber-500/40 focus:outline-none font-mono"
            />
            {codeSearch && filteredCodes.length > 0 && filteredCodes.length <= 10 && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-white/10 bg-gray-900 shadow-xl z-10 overflow-hidden">
                {filteredCodes.map((dtc) => (
                  <Link
                    key={dtc.code}
                    href={`${basePath}/codes/${dtc.code.toLowerCase()}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition border-b border-white/5 last:border-0"
                  >
                    <div>
                      <span className="font-mono font-bold text-amber-400">{dtc.code}</span>
                      {dtc.title && dtc.title !== dtc.code && (
                        <span className="text-gray-400 text-sm ml-2">{dtc.title}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-600 uppercase">{dtc.system.substring(0, 20)}</span>
                  </Link>
                ))}
              </div>
            )}
            {codeSearch && filteredCodes.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-white/10 bg-gray-900 shadow-xl z-10 p-4 text-center">
                <p className="text-gray-400 text-sm">
                  No factory data for &ldquo;{codeSearch}&rdquo; on this vehicle.
                </p>
                <Link
                  href={`/codes/${codeSearch.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
                  className="text-cyan-400 text-sm hover:underline mt-1 inline-block"
                >
                  Check general {codeSearch.toUpperCase()} info →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Path B: Help me diagnose */}
        <Link
          href={diagnosePath}
          className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-6 hover:border-cyan-500/40 transition-all group block"
        >
          <h2 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition">
            Help me diagnose
          </h2>
          <p className="text-gray-400 text-sm mb-4">
            Describe your symptoms and we&apos;ll walk you through the diagnostic process
            using factory data for your {displayName}.
          </p>
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/15 border border-cyan-500/25 rounded-lg text-cyan-300 text-sm font-semibold group-hover:bg-cyan-500/25 transition">
            Start AI Diagnosis →
          </span>
        </Link>
      </div>

      {/* Codes browser — dropdown style */}
      {dtcCodes.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-bold text-white">
              Factory Diagnostic Codes
              <span className="text-gray-500 font-normal text-sm ml-2">({dtcCodes.length})</span>
            </h2>
            {dtcSystems.length > 1 && (
              <select
                value={selectedSystem}
                onChange={(e) => setSelectedSystem(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-sm text-gray-300 focus:border-amber-500/40 focus:outline-none"
              >
                <option value="all">All systems</option>
                {dtcSystems.map((s) => (
                  <option key={s.slug} value={s.name}>
                    {s.name} ({s.dtcCount})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Compact code list */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] divide-y divide-white/5 max-h-[400px] overflow-y-auto">
            {(codeSearch ? filteredCodes : filteredCodes.slice(0, 50)).map((dtc) => (
              <Link
                key={dtc.code}
                href={`${basePath}/codes/${dtc.code.toLowerCase()}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition group"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-amber-400 group-hover:text-amber-300 w-16 shrink-0">
                    {dtc.code}
                  </span>
                  <span className="text-sm text-gray-300">
                    {dtc.title && dtc.title !== dtc.code ? dtc.title : dtc.system}
                  </span>
                </div>
                <span className="text-gray-600 text-xs shrink-0">→</span>
              </Link>
            ))}
            {!codeSearch && filteredCodes.length > 50 && (
              <div className="px-4 py-3 text-center text-gray-500 text-sm">
                Showing 50 of {filteredCodes.length} codes — type above to filter
              </div>
            )}
          </div>
        </section>
      )}

      {/* Systems overview — collapsed, secondary */}
      <details className="mb-12 group">
        <summary className="cursor-pointer text-lg font-bold text-white mb-2 list-none flex items-center gap-2">
          <span className="text-gray-500 group-open:rotate-90 transition-transform">&#9654;</span>
          Vehicle Systems ({systems.length})
        </summary>
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          {systems.map((sys) => (
            <div
              key={sys.slug}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
            >
              <h3 className="font-semibold text-white text-sm mb-1">{sys.name}</h3>
              <div className="flex flex-wrap gap-2 text-xs">
                {sys.procedureCount > 0 && (
                  <span className="text-cyan-400">{sys.procedureCount} procedures</span>
                )}
                {sys.diagramCount > 0 && (
                  <span className="text-violet-400">{sys.diagramCount} diagrams</span>
                )}
                {sys.dtcCount > 0 && (
                  <span className="text-amber-400">{sys.dtcCount} DTCs</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </details>
    </>
  );
}
