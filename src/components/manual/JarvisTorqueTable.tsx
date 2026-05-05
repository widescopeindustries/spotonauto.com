'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wrench, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';

interface TorqueSpec {
  component: string;
  value: string;
  unit: string;
  context: string;
  note?: string;
}

interface JarvisTorqueTableProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: string;
  contentHtml: string;
}

const TORQUE_PATTERNS = [
  // "XX lb-ft" or "XX lb ft" or "XX ft-lb" or "XX ft lb"
  { regex: /(\d+(?:\.\d+)?)\s*(?:lb?[-\s]?ft|ft[-\s]?lb?)/gi, unit: 'lb-ft' },
  // "XX N·m" or "XX Nm" or "XX nm"
  { regex: /(\d+(?:\.\d+)?)\s*(?:N\s*·?\s*m|nm)\b/gi, unit: 'N·m' },
  // "XX in-lb" or "XX in lb"
  { regex: /(\d+(?:\.\d+)?)\s*(?:in[-\s]?lb?|lb?[-\s]?in)\b/gi, unit: 'in-lb' },
  // "XX kgf·m" or "XX kgf m"
  { regex: /(\d+(?:\.\d+)?)\s*(?:kgf\s*·?\s*m|kgf[-\s]?m)\b/gi, unit: 'kgf·m' },
];

function extractTorqueSpecs(html: string): TorqueSpec[] {
  const specs: TorqueSpec[] = [];
  const seen = new Set<string>();

  // Parse HTML into text blocks by paragraph or table row
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const elements = doc.querySelectorAll('p, li, tr, td');

  elements.forEach((el) => {
    const text = el.textContent || '';
    const cleanText = text.replace(/\s+/g, ' ').trim();
    if (cleanText.length < 10) return;

    for (const { regex, unit } of TORQUE_PATTERNS) {
      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(cleanText)) !== null) {
        const value = match[1];
        const fullMatch = match[0];
        const key = `${cleanText.slice(0, 60)}|${fullMatch}`;
        if (seen.has(key)) continue;
        seen.add(key);

        // Try to extract component name from the text
        let component = 'General';
        const componentPatterns = [
          /^([A-Z][A-Za-z\s\-]+?(?:bolt|nut|plug|cap|cover|sensor|pump|valve|arm|rod|strap|bracket|clamp|hose|line|pipe|manifold|gasket|seal|bearing|pulley|tensioner))/i,
          /([A-Z][A-Za-z\s\-]+?(?:bolt|nut|plug|cap|cover|sensor|pump|valve))/i,
          /([A-Z][A-Za-z\s]+?)\s*:/,
          /^\d+\.?\s*([A-Z][A-Za-z\s\-]+?)(?:\(|\[|:|–|-)/,
        ];
        for (const pattern of componentPatterns) {
          const cmatch = cleanText.match(pattern);
          if (cmatch && cmatch[1] && cmatch[1].length > 2 && cmatch[1].length < 60) {
            component = cmatch[1].trim();
            break;
          }
        }

        // Extract surrounding context (20 chars before and after)
        const matchIndex = match.index || 0;
        const contextStart = Math.max(0, matchIndex - 30);
        const contextEnd = Math.min(cleanText.length, matchIndex + fullMatch.length + 30);
        const context = cleanText.slice(contextStart, contextEnd).replace(fullMatch, `**${fullMatch}**`);

        // Look for notes nearby (e.g., "(torque to yield)", "(replace)")
        const noteMatch = cleanText.match(/\(([^)]+(?:yield|replace|reuse|torque|angle|deg|degree)[^)]*)\)/i);
        const note = noteMatch ? noteMatch[1] : undefined;

        specs.push({ component, value, unit, context, note });
      }
    }
  });

  return specs;
}

export default function JarvisTorqueTable({
  isOpen,
  onClose,
  vehicle,
  contentHtml,
}: JarvisTorqueTableProps) {
  const [sortBy, setSortBy] = useState<'component' | 'value'>('component');
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const specs = useMemo(() => {
    if (!isOpen) return [];
    return extractTorqueSpecs(contentHtml);
  }, [contentHtml, isOpen]);

  const sortedSpecs = useMemo(() => {
    return [...specs].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'component') {
        cmp = a.component.localeCompare(b.component);
      } else {
        cmp = Number(a.value) - Number(b.value);
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [specs, sortBy, sortAsc]);

  const unitGroups = useMemo(() => {
    const groups: Record<string, TorqueSpec[]> = {};
    for (const spec of specs) {
      if (!groups[spec.unit]) groups[spec.unit] = [];
      groups[spec.unit].push(spec);
    }
    return groups;
  }, [specs]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[#050507]/95 backdrop-blur-xl"
        >
          {/* HUD frame */}
          <div className="absolute inset-4 border border-orange-500/20 rounded-2xl pointer-events-none" />
          <div className="absolute top-4 left-8 px-3 py-1 bg-[#050507] text-[10px] font-mono text-orange-400/60 uppercase tracking-widest">
            Torque Specification Database
          </div>

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between px-8 pt-8 pb-4">
            <div className="flex items-center gap-3">
              <Wrench className="w-5 h-5 text-orange-400" />
              <div>
                <h2 className="text-lg font-display font-bold text-white">Torque Specifications</h2>
                <p className="text-xs text-white/40 font-mono">{vehicle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Unit summary badges */}
              {Object.entries(unitGroups).map(([unit, group]) => (
                <span
                  key={unit}
                  className="text-[10px] font-mono px-2 py-1 rounded-full border border-orange-500/20 bg-orange-500/5 text-orange-300/60"
                >
                  {group.length} {unit}
                </span>
              ))}
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all text-xs text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
                CLOSE
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="relative z-10 px-8 pb-8 h-[calc(100vh-120px)] overflow-auto">
            {specs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/20">
                <Wrench className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-mono">NO TORQUE SPECS FOUND IN THIS SECTION</p>
                <p className="text-xs text-white/10 mt-2">Try browsing a procedure or component page</p>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_100px_80px_40px] gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                  <button
                    onClick={() => {
                      if (sortBy === 'component') setSortAsc(!sortAsc);
                      else { setSortBy('component'); setSortAsc(true); }
                    }}
                    className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-white/30 hover:text-orange-400 transition-colors text-left"
                  >
                    Component
                    {sortBy === 'component' && <ArrowUpDown className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => {
                      if (sortBy === 'value') setSortAsc(!sortAsc);
                      else { setSortBy('value'); setSortAsc(true); }
                    }}
                    className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-white/30 hover:text-orange-400 transition-colors text-left"
                  >
                    Value
                    {sortBy === 'value' && <ArrowUpDown className="w-3 h-3" />}
                  </button>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/30">Unit</span>
                  <span />
                </div>

                {/* Table rows */}
                {sortedSpecs.map((spec, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-white/[0.03] last:border-0"
                  >
                    <button
                      onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                      className="w-full grid grid-cols-[1fr_100px_80px_40px] gap-2 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors items-center"
                    >
                      <span className="text-sm text-white/70 truncate">{spec.component}</span>
                      <span className="text-sm font-mono text-orange-300/80">{spec.value}</span>
                      <span className="text-xs font-mono text-white/40">{spec.unit}</span>
                      <span className="flex justify-center">
                        {expandedRow === i ? (
                          <ChevronUp className="w-3 h-3 text-white/20" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-white/20" />
                        )}
                      </span>
                    </button>

                    <AnimatePresence>
                      {expandedRow === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-3 pl-8 space-y-2">
                            <p className="text-xs text-white/40 font-mono leading-relaxed">
                              {spec.context}
                            </p>
                            {spec.note && (
                              <span className="inline-block text-[10px] font-mono px-2 py-1 rounded bg-amber-500/10 text-amber-300/60 border border-amber-500/20">
                                NOTE: {spec.note}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
