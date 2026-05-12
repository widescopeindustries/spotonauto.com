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

interface GraphProcedure {
  id: string;
  title: string;
  url: string | null;
  system: string;
  component: string | null;
}

interface GraphDtc {
  code: string;
  description: string | null;
  component: string;
}

interface GraphSystem {
  name: string;
  procedureCount: number;
}

interface RepairProfileEntry {
  task: string;
  title: string;
}

interface ToolPageEntry {
  slug: string;
  title: string;
  toolType: string;
  quickAnswer: string;
}

interface VehicleLaneClientProps {
  displayName: string;
  basePath: string;
  repairPath: string;
  diagnosePath: string;
  dtcCodes: DtcCodeEntry[];
  systems: SystemEntry[];
  graph?: {
    procedures: GraphProcedure[];
    dtcs: GraphDtc[];
    systems: GraphSystem[];
  };
  repairProfiles: RepairProfileEntry[];
  toolPages: ToolPageEntry[];
}

const TASK_CATEGORIES: Array<{
  id: string;
  label: string;
  tasks: string[];
  icon: string;
  tone: 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose' | 'slate';
}> = [
  {
    id: 'brakes',
    label: 'Brakes',
    tasks: ['brake-pad-replacement', 'brake-rotor-replacement', 'brake-fluid-flush'],
    icon: '🛑',
    tone: 'cyan',
  },
  {
    id: 'engine',
    label: 'Engine',
    tasks: ['oil-change', 'spark-plug-replacement', 'serpentine-belt-replacement', 'timing-belt-replacement', 'timing-chain-replacement'],
    icon: '⚙️',
    tone: 'emerald',
  },
  {
    id: 'electrical',
    label: 'Electrical',
    tasks: ['battery-replacement', 'alternator-replacement', 'starter-replacement', 'headlight-bulb-replacement', 'tail-light-replacement'],
    icon: '⚡',
    tone: 'amber',
  },
  {
    id: 'cooling',
    label: 'Cooling',
    tasks: ['thermostat-replacement', 'water-pump-replacement', 'radiator-replacement', 'coolant-flush'],
    icon: '❄️',
    tone: 'violet',
  },
  {
    id: 'filters',
    label: 'Filters',
    tasks: ['cabin-air-filter-replacement', 'engine-air-filter-replacement', 'fuel-filter-replacement'],
    icon: '🌬️',
    tone: 'rose',
  },
  {
    id: 'transmission',
    label: 'Transmission',
    tasks: ['transmission-fluid-change', 'clutch-replacement'],
    icon: '🔧',
    tone: 'slate',
  },
];

const toneStyles: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  cyan:    { border: 'border-cyan-500/20',    bg: 'bg-cyan-500/[0.04]',    text: 'text-cyan-300',    badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' },
  emerald: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/[0.04]', text: 'text-emerald-300', badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  amber:   { border: 'border-amber-500/20',   bg: 'bg-amber-500/[0.04]',   text: 'text-amber-300',   badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
  violet:  { border: 'border-violet-500/20',  bg: 'bg-violet-500/[0.04]',  text: 'text-violet-300',  badge: 'bg-violet-500/10 text-violet-300 border-violet-500/20' },
  rose:    { border: 'border-rose-500/20',    bg: 'bg-rose-500/[0.04]',    text: 'text-rose-300',    badge: 'bg-rose-500/10 text-rose-300 border-rose-500/20' },
  slate:   { border: 'border-slate-500/20',   bg: 'bg-slate-500/[0.04]',   text: 'text-slate-300',   badge: 'bg-slate-500/10 text-slate-300 border-slate-500/20' },
};

export default function VehicleLaneClient({
  displayName,
  basePath,
  repairPath,
  diagnosePath,
  dtcCodes,
  systems,
  graph,
  repairProfiles,
  toolPages,
}: VehicleLaneClientProps) {
  const [codeSearch, setCodeSearch] = useState('');
  const [selectedSystem, setSelectedSystem] = useState('all');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

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

  const dtcSystems = useMemo(
    () => systems.filter((s) => s.dtcCount > 0).sort((a, b) => b.dtcCount - a.dtcCount),
    [systems],
  );

  // Build category → available tasks map
  const categoryTasks = useMemo(() => {
    const profileSet = new Set(repairProfiles.map((p) => p.task));
    const map = new Map<string, RepairProfileEntry[]>();
    for (const cat of TASK_CATEGORIES) {
      const matches = cat.tasks
        .filter((t) => profileSet.has(t))
        .map((t) => repairProfiles.find((p) => p.task === t)!)
        .filter(Boolean);
      if (matches.length > 0) {
        map.set(cat.id, matches);
      }
    }
    return map;
  }, [repairProfiles]);

  const hasAnyProfiles = repairProfiles.length > 0;
  const hasMaintenance = true; // Always offer maintenance quick links
  const hasWiring = systems.some((s) => s.diagramCount > 0);
  const hasToolPages = toolPages.length > 0;

  const toolTypeMeta: Record<string, { icon: string; label: string; tone: string }> = {
    'oil-type': { icon: '🛢️', label: 'Oil Type', tone: 'cyan' },
    'battery-location': { icon: '🔋', label: 'Battery', tone: 'amber' },
    'tire-size': { icon: '🛞', label: 'Tires', tone: 'violet' },
    'serpentine-belt': { icon: '➰', label: 'Serpentine Belt', tone: 'emerald' },
    'headlight-bulb': { icon: '💡', label: 'Headlight', tone: 'amber' },
    'fluid-capacity': { icon: '💧', label: 'Fluid Capacity', tone: 'cyan' },
    'spark-plug-type': { icon: '⚡', label: 'Spark Plugs', tone: 'rose' },
    'wiper-blade-size': { icon: '🌧️', label: 'Wipers', tone: 'slate' },
    'coolant-type': { icon: '❄️', label: 'Coolant', tone: 'emerald' },
    'transmission-fluid-type': { icon: '🔄', label: 'Transmission Fluid', tone: 'slate' },
  };

  return (
    <>
      {/* ── Quick Action Hub ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
        {/* Repair Guides */}
        <Link
          href={repairPath}
          className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-4 hover:border-cyan-500/40 transition-all group text-center"
        >
          <div className="text-2xl mb-2">🔧</div>
          <div className="text-sm font-semibold text-cyan-300 group-hover:text-cyan-200">
            Repair Guides
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {repairProfiles.length > 0 ? `${repairProfiles.length} guides` : 'Browse all'}
          </div>
        </Link>

        {/* DTC Codes */}
        <a
          href="#dtc-codes"
          className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4 hover:border-amber-500/40 transition-all group text-center block"
        >
          <div className="text-2xl mb-2">🔍</div>
          <div className="text-sm font-semibold text-amber-300 group-hover:text-amber-200">
            DTC Codes
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {dtcCodes.length > 0 ? `${dtcCodes.length} codes` : 'Search'}
          </div>
        </a>

        {/* Maintenance */}
        <Link
          href={`/maintenance/${basePath.split('/').slice(2).join('/')}`}
          className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 hover:border-emerald-500/40 transition-all group text-center"
        >
          <div className="text-2xl mb-2">🛠️</div>
          <div className="text-sm font-semibold text-emerald-300 group-hover:text-emerald-200">
            Maintenance
          </div>
          <div className="text-xs text-gray-500 mt-1">Oil, tires, coolant</div>
        </Link>

        {/* Wiring */}
        <Link
          href={`/wiring/${basePath.split('/').slice(2).join('/')}`}
          className={`rounded-2xl border p-4 transition-all group text-center ${
            hasWiring
              ? 'border-violet-500/20 bg-violet-500/[0.04] hover:border-violet-500/40'
              : 'border-white/10 bg-white/[0.02] opacity-50 cursor-not-allowed pointer-events-none'
          }`}
        >
          <div className="text-2xl mb-2">📐</div>
          <div className={`text-sm font-semibold ${hasWiring ? 'text-violet-300 group-hover:text-violet-200' : 'text-gray-500'}`}>
            Wiring
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {hasWiring ? 'Diagrams' : 'Coming soon'}
          </div>
        </Link>

        {/* Factory Manual */}
        <Link
          href={`/manual/${encodeURIComponent(displayName.split(' ').slice(1, 2).join(''))}/${displayName.split(' ')[0]}`}
          className="rounded-2xl border border-slate-500/20 bg-slate-500/[0.04] p-4 hover:border-slate-500/40 transition-all group text-center"
        >
          <div className="text-2xl mb-2">📖</div>
          <div className="text-sm font-semibold text-slate-300 group-hover:text-slate-200">
            Factory Manual
          </div>
          <div className="text-xs text-gray-500 mt-1">Full OEM data</div>
        </Link>

        {/* AI Diagnose */}
        <Link
          href={diagnosePath}
          className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.04] p-4 hover:border-cyan-500/40 transition-all group text-center"
        >
          <div className="text-2xl mb-2">🤖</div>
          <div className="text-sm font-semibold text-cyan-300 group-hover:text-cyan-200">
            Ask Manual
          </div>
          <div className="text-xs text-gray-500 mt-1">AI diagnosis</div>
        </Link>
      </div>

      {/* ── Vehicle-Scoped Search ── */}
      <div className="mb-10">
        <div className="relative">
          <input
            type="text"
            value={vehicleSearch}
            onChange={(e) => setVehicleSearch(e.target.value)}
            placeholder={`Search ${displayName} repairs, codes, diagrams…`}
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-gray-500 focus:border-cyan-500/40 focus:outline-none"
          />
          {vehicleSearch.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-white/10 bg-gray-900 shadow-xl z-10 overflow-hidden">
              {/* Match repair profiles */}
              {repairProfiles
                .filter((p) => p.title.toLowerCase().includes(vehicleSearch.toLowerCase()))
                .slice(0, 5)
                .map((p) => (
                  <Link
                    key={p.task}
                    href={`${repairPath}/${p.task}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition border-b border-white/5 last:border-0"
                  >
                    <span className="text-xs uppercase tracking-wider text-cyan-400 shrink-0">Repair</span>
                    <span className="text-sm text-white">{p.title}</span>
                  </Link>
                ))}
              {/* Match DTC codes */}
              {dtcCodes
                .filter(
                  (c) =>
                    c.code.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
                    c.title.toLowerCase().includes(vehicleSearch.toLowerCase()),
                )
                .slice(0, 5)
                .map((c) => (
                  <Link
                    key={c.code}
                    href={`${basePath}/codes/${c.code.toLowerCase()}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition border-b border-white/5 last:border-0"
                  >
                    <span className="text-xs uppercase tracking-wider text-amber-400 shrink-0">DTC</span>
                    <span className="font-mono text-sm text-white">{c.code}</span>
                    <span className="text-sm text-gray-400">{c.title}</span>
                  </Link>
                ))}
              {/* Match systems */}
              {systems
                .filter((s) => s.name.toLowerCase().includes(vehicleSearch.toLowerCase()))
                .slice(0, 3)
                .map((s) => (
                  <div
                    key={s.slug}
                    className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0"
                  >
                    <span className="text-xs uppercase tracking-wider text-violet-400 shrink-0">System</span>
                    <span className="text-sm text-white">{s.name}</span>
                    <span className="text-xs text-gray-500">
                      {s.procedureCount} procedures · {s.diagramCount} diagrams
                    </span>
                  </div>
                ))}
              {repairProfiles.filter((p) =>
                p.title.toLowerCase().includes(vehicleSearch.toLowerCase()),
              ).length === 0 &&
                dtcCodes.filter(
                  (c) =>
                    c.code.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
                    c.title.toLowerCase().includes(vehicleSearch.toLowerCase()),
                ).length === 0 &&
                systems.filter((s) =>
                  s.name.toLowerCase().includes(vehicleSearch.toLowerCase()),
                ).length === 0 && (
                  <div className="px-4 py-3 text-center text-gray-500 text-sm">
                    No matches. Try "brake", "P0420", or a system name.
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Specs from Corpus ── */}
      {hasToolPages && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">
              Quick Specs
              <span className="text-gray-500 font-normal text-sm ml-2">({toolPages.length})</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {toolPages.map((tp) => {
              const meta = toolTypeMeta[tp.toolType] || { icon: '📋', label: tp.toolType, tone: 'slate' };
              const styles = toneStyles[meta.tone] || toneStyles.slate;
              return (
                <Link
                  key={tp.slug}
                  href={`/tools/${tp.slug}`}
                  className={`rounded-xl border ${styles.border} ${styles.bg} p-4 hover:opacity-90 transition-all group`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{meta.icon}</span>
                    <span className="font-semibold text-white text-sm">{meta.label}</span>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2">{tp.quickAnswer}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Repair Guides by Category ── */}
      {hasAnyProfiles && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">
              Repair Guides
              <span className="text-gray-500 font-normal text-sm ml-2">({repairProfiles.length})</span>
            </h2>
            <Link
              href={repairPath}
              className="text-sm text-cyan-400 hover:text-cyan-300 transition"
            >
              View all →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TASK_CATEGORIES.map((cat) => {
              const tasks = categoryTasks.get(cat.id);
              if (!tasks) return null;
              const styles = toneStyles[cat.tone];
              const isExpanded = expandedCategory === cat.id;

              return (
                <div
                  key={cat.id}
                  className={`rounded-xl border ${styles.border} ${styles.bg} p-4`}
                >
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{cat.icon}</span>
                      <span className="font-semibold text-white text-sm">{cat.label}</span>
                      <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${styles.badge}`}>
                        {tasks.length}
                      </span>
                    </div>
                    <span className={`text-gray-500 text-xs transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                      ▶
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="mt-3 space-y-1">
                      {tasks.map((t) => (
                        <Link
                          key={t.task}
                          href={`${repairPath}/${t.task}`}
                          className={`block text-sm ${styles.text} hover:underline py-1`}
                        >
                          {t.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Neo4j graph data panel ── */}
      {graph && graph.procedures.length > 0 && (
        <section className="mb-10 rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Exact-Fit Procedures from Service Manual</h2>
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300 border border-emerald-500/25">
              {graph.procedures.length} found
            </span>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {graph.procedures.map((proc) => (
              <div
                key={proc.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 hover:border-emerald-500/30 transition"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{proc.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] uppercase tracking-wider text-emerald-300/70 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      {proc.system}
                    </span>
                    {proc.component && (
                      <span className="text-[10px] text-gray-500">{proc.component}</span>
                    )}
                  </div>
                </div>
                {proc.url ? (
                  <Link
                    href={proc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 shrink-0 text-xs text-emerald-400 hover:text-emerald-200 transition"
                  >
                    View →
                  </Link>
                ) : (
                  <span className="ml-4 shrink-0 text-xs text-gray-600">No link</span>
                )}
              </div>
            ))}
          </div>

          {graph.dtcs.length > 0 && (
            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300 mb-3">Related DTC Codes</p>
              <div className="flex flex-wrap gap-2">
                {graph.dtcs.map((dtc) => (
                  <Link
                    key={dtc.code}
                    href={`${basePath}/codes/${dtc.code.toLowerCase()}`}
                    className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-amber-100 hover:border-amber-400/35 hover:bg-amber-500/15 transition-all"
                  >
                    {dtc.code}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Two-path entry ── */}
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

      {/* ── DTC Codes browser ── */}
      {dtcCodes.length > 0 && (
        <section id="dtc-codes" className="mb-12">
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

      {/* ── Systems overview ── */}
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
