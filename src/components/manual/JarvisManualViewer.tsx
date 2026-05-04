'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, BookOpen, Zap, Wrench, AlertTriangle } from 'lucide-react';
import SatellitePanel, { type PanelType } from './SatellitePanel';
import ConnectionLines from './ConnectionLines';

interface RelatedSection {
  id: string;
  title: string;
  path: string;
  type: PanelType;
  preview?: string;
}

interface JarvisManualViewerProps {
  title: string;
  vehicle: string;
  contentHtml: string;
  breadcrumbs: Array<{ label: string; href: string }>;
  parent?: RelatedSection | null;
  siblings: RelatedSection[];
  childSections: RelatedSection[];
  dtcCodes?: RelatedSection[];
  wiringDiagrams?: RelatedSection[];
  isNavigation?: boolean;
  navLinks?: Array<{ label: string; href: string }>;
}

export default function JarvisManualViewer({
  title,
  vehicle,
  contentHtml,
  breadcrumbs,
  parent,
  siblings,
  childSections,
  dtcCodes = [],
  wiringDiagrams = [],
  isNavigation,
  navLinks = [],
}: JarvisManualViewerProps) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [bottomOpen, setBottomOpen] = useState(true);
  const [activePanel, setActivePanel] = useState('main');

  const handlePanelHover = useCallback((id: string) => {
    setActivePanel(id);
  }, []);

  const allPanels = [
    { id: 'main', x: typeof window !== 'undefined' ? window.innerWidth / 2 - 300 : 400, y: 200, width: 600, height: 500 },
    ...(leftOpen && parent ? [{ id: parent.id, x: 50, y: 200, width: 280, height: 120 }] : []),
    ...(rightOpen ? siblings.slice(0, 3).map((s, i) => ({
      id: s.id,
      x: typeof window !== 'undefined' ? window.innerWidth - 330 : 900,
      y: 150 + i * 140,
      width: 280,
      height: 120,
    })) : []),
  ];

  return (
    <div className="relative min-h-screen bg-[#050507] overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34, 211, 238, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 211, 238, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Connection lines */}
      <ConnectionLines panels={allPanels} activePanelId={activePanel} />

      {/* Top bar */}
      <div className="relative z-30 border-b border-white/5 bg-[#050507]/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-2">
                <Link
                  href={crumb.href}
                  className="text-white/40 hover:text-cyan-400 transition-colors"
                >
                  {crumb.label}
                </Link>
                {i < breadcrumbs.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-white/20" />
                )}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/30 font-mono uppercase tracking-wider">
              {vehicle}
            </span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 py-8 grid grid-cols-[280px_1fr_280px] gap-6">
        {/* Left column — Navigation */}
        <div className="space-y-4">
          {/* Parent panel */}
          {parent && (
            <SatellitePanel
              id={parent.id}
              title={parent.title}
              type="parent"
              href={parent.path}
              position="left"
              isOpen={leftOpen}
              onToggle={() => setLeftOpen(!leftOpen)}
              badge="Up"
            />
          )}

          {/* Toggle button */}
          <button
            onClick={() => setLeftOpen(!leftOpen)}
            className="flex items-center gap-2 text-xs text-white/30 hover:text-cyan-400 transition-colors"
          >
            {leftOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {leftOpen ? 'Collapse nav' : 'Expand nav'}
          </button>

          {/* Child sections mini-list */}
          {childSections.length > 0 && (
            <div className="glass rounded-xl border border-white/5 p-3">
              <h5 className="text-[10px] uppercase tracking-wider text-white/30 mb-2 flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Subsections
              </h5>
              <div className="space-y-1">
                {childSections.slice(0, 6).map((child) => (
                  <Link
                    key={child.id}
                    href={child.path}
                    className="block text-xs text-white/50 hover:text-cyan-300 py-1 px-2 rounded hover:bg-white/5 transition-all truncate"
                    onMouseEnter={() => handlePanelHover(child.id)}
                    onMouseLeave={() => handlePanelHover('main')}
                  >
                    {child.title}
                  </Link>
                ))}
                {childSections.length > 6 && (
                  <span className="text-[10px] text-white/20 px-2">
                    +{childSections.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Center column — Main content */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
            onMouseEnter={() => handlePanelHover('main')}
          >
            {/* Main holographic panel */}
            <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-[#12121A]/90 to-[#0a0a0f]/90 backdrop-blur-xl shadow-2xl shadow-cyan-500/5">
              {/* Top glow line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

              {/* Corner accents */}
              <div className="absolute top-3 left-3 w-8 h-8 border-t border-l border-cyan-500/30 rounded-tl-lg" />
              <div className="absolute top-3 right-3 w-8 h-8 border-t border-r border-cyan-500/30 rounded-tr-lg" />
              <div className="absolute bottom-3 left-3 w-8 h-8 border-b border-l border-cyan-500/30 rounded-bl-lg" />
              <div className="absolute bottom-3 right-3 w-8 h-8 border-b border-r border-cyan-500/30 rounded-br-lg" />

              {/* Content */}
              <div className="relative px-8 py-10">
                <h1 className="text-2xl font-display font-bold text-white mb-2">
                  {title}
                </h1>
                <p className="text-sm text-white/40 mb-6 font-mono">{vehicle}</p>

                {isNavigation && navLinks.length > 0 ? (
                  <div className="grid gap-3">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="group flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all"
                        onMouseEnter={() => handlePanelHover(link.href)}
                      >
                        <span className="text-white/80 group-hover:text-white transition-colors">
                          {link.label}
                        </span>
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-cyan-400 transition-colors" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div
                    className="manual-content"
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                  />
                )}
              </div>
            </div>
          </motion.div>

          {/* Bottom action bar */}
          <div className="flex items-center gap-3">
            {dtcCodes.length > 0 && (
              <button
                onClick={() => setBottomOpen(!bottomOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs hover:bg-amber-500/10 transition-colors"
              >
                <AlertTriangle className="w-3 h-3" />
                {dtcCodes.length} DTC Codes
              </button>
            )}
            {wiringDiagrams.length > 0 && (
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-violet-500/20 bg-violet-500/5 text-violet-300 text-xs hover:bg-violet-500/10 transition-colors">
                <Zap className="w-3 h-3" />
                {wiringDiagrams.length} Wiring Diagrams
              </button>
            )}
          </div>
        </div>

        {/* Right column — Related */}
        <div className="space-y-4">
          {siblings.slice(0, 4).map((sibling) => (
            <SatellitePanel
              key={sibling.id}
              id={sibling.id}
              title={sibling.title}
              type="sibling"
              href={sibling.path}
              position="right"
              isOpen={rightOpen}
              onToggle={() => setRightOpen(!rightOpen)}
            >
              {sibling.preview}
            </SatellitePanel>
          ))}

          {siblings.length === 0 && (
            <div className="glass rounded-xl border border-white/5 p-4 text-center">
              <Wrench className="w-5 h-5 text-white/20 mx-auto mb-2" />
              <p className="text-xs text-white/30">No related sections</p>
            </div>
          )}

          <button
            onClick={() => setRightOpen(!rightOpen)}
            className="flex items-center gap-2 text-xs text-white/30 hover:text-cyan-400 transition-colors ml-auto justify-end"
          >
            {rightOpen ? 'Collapse related' : 'Expand related'}
            {rightOpen ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  );
}
