'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, BookOpen, Zap, Wrench, AlertTriangle, Activity } from 'lucide-react';
import SatellitePanel, { type PanelType } from './SatellitePanel';

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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-[#050507] overflow-hidden selection:bg-cyan-500/30"
    >
      {/* Animated background grid with depth */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34, 211, 238, 0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 211, 238, 0.4) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      />

      {/* Scan line overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03]">
        <div
          className="w-full h-1 bg-gradient-to-b from-cyan-400 to-transparent"
          style={{
            animation: 'scanline 8s linear infinite',
          }}
        />
      </div>

      {/* Corner HUD brackets */}
      <HUDCorner position="top-left" />
      <HUDCorner position="top-right" />
      <HUDCorner position="bottom-left" />
      <HUDCorner position="bottom-right" />

      {/* Central pulsing ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
        <div className="w-[600px] h-[600px] rounded-full border border-cyan-500/10 animate-pulse" />
        <div className="absolute inset-8 rounded-full border border-cyan-500/5" />
        <div className="absolute inset-16 rounded-full border border-white/5" />
      </div>

      {/* Top status bar */}
      <div className="relative z-30 border-b border-cyan-500/10 bg-[#050507]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs font-mono">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400/80">SYS.OK</span>
            <span className="text-white/20">|</span>
            <span className="text-white/40">MANUAL.DB</span>
            <span className="text-cyan-400/60 animate-pulse">● LIVE</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <Link
                  href={crumb.href}
                  className="text-white/30 hover:text-cyan-400 transition-colors font-mono"
                >
                  {crumb.label.toUpperCase()}
                </Link>
                {i < breadcrumbs.length - 1 && (
                  <ChevronRight className="w-2 h-2 text-white/10" />
                )}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-white/30">{vehicle}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main 3-column layout */}
      <div
        className="relative z-20 max-w-[1400px] mx-auto px-4 py-6 grid grid-cols-[280px_1fr_280px] gap-5"
        style={{
          transform: `perspective(1200px) rotateX(${mousePos.y * 0.02}deg) rotateY(${mousePos.x * 0.02}deg)`,
          transition: 'transform 0.3s ease-out',
        }}
      >
        {/* LEFT: Navigation stack */}
        <div className="space-y-3">
          <AnimatePresence>
            {parent && leftOpen && (
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                <SatellitePanel
                  id={parent.id}
                  title={parent.title}
                  type="parent"
                  href={parent.path}
                  position="left"
                  isOpen={true}
                  onToggle={() => setLeftOpen(false)}
                  badge="UP"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {!leftOpen && (
            <button
              onClick={() => setLeftOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-xs hover:bg-cyan-500/10 transition-all"
            >
              <ChevronRight className="w-3 h-3" />
              Nav
            </button>
          )}

          {/* Child sections list */}
          {childSections.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-3"
            >
              <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-wider text-white/30 font-mono">
                <BookOpen className="w-3 h-3" />
                Subsections
              </div>
              <div className="space-y-0.5">
                {childSections.slice(0, 8).map((child, i) => (
                  <motion.div
                    key={child.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                  >
                    <Link
                      href={child.path}
                      className="flex items-center gap-2 py-1.5 px-2 rounded text-xs text-white/50 hover:text-cyan-300 hover:bg-cyan-500/5 transition-all group"
                    >
                      <span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-cyan-400 transition-colors" />
                      <span className="truncate">{child.title}</span>
                    </Link>
                  </motion.div>
                ))}
                {childSections.length > 8 && (
                  <span className="text-[10px] text-white/20 px-2">
                    +{childSections.length - 8} more
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* CENTER: Main content */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative"
          >
            {/* Main holographic panel */}
            <div className="relative overflow-hidden rounded-2xl border border-cyan-500/15 bg-gradient-to-b from-[#0d0d14]/95 to-[#06060a]/95 backdrop-blur-2xl">
              {/* Animated top edge glow */}
              <div className="absolute top-0 left-0 right-0 h-[2px]">
                <div className="h-full bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-pulse" />
              </div>

              {/* Corner brackets */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-cyan-500/40 rounded-tl-md" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-cyan-500/40 rounded-tr-md" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-cyan-500/40 rounded-bl-md" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-cyan-500/40 rounded-br-md" />

              {/* Side status indicators */}
              <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-3 rounded-full bg-cyan-500/20"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>

              {/* Content area */}
              <div className="relative px-10 py-10">
                {/* Title with typewriter reveal */}
                <motion.h1
                  className="text-2xl md:text-3xl font-display font-bold text-white mb-2 tracking-tight"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  {title}
                </motion.h1>

                <motion.div
                  className="flex items-center gap-3 mb-8"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {vehicle}
                  </span>
                  <span className="text-[10px] text-white/20 font-mono">
                    SECTION {breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : 'ROOT'}
                  </span>
                </motion.div>

                {isNavigation && navLinks.length > 0 ? (
                  <div className="grid gap-2">
                    {navLinks.map((link, i) => (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                      >
                        <Link
                          href={link.href}
                          className="group flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:border-cyan-500/30 hover:bg-cyan-500/[0.03] transition-all"
                        >
                          <span className="text-white/70 group-hover:text-white transition-colors font-mono text-sm">
                            {link.label}
                          </span>
                          <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-cyan-400 transition-colors" />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="manual-content"
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                  />
                )}
              </div>
            </div>
          </motion.div>

          {/* Bottom action dock */}
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            {dtcCodes.length > 0 && (
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs hover:bg-amber-500/10 transition-all font-mono">
                <AlertTriangle className="w-3 h-3" />
                {dtcCodes.length} DTC
              </button>
            )}
            {wiringDiagrams.length > 0 && (
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-violet-500/20 bg-violet-500/5 text-violet-300 text-xs hover:bg-violet-500/10 transition-all font-mono">
                <Zap className="w-3 h-3" />
                {wiringDiagrams.length} WIRING
              </button>
            )}
            <div className="flex-1" />
            <span className="text-[10px] text-white/20 font-mono">
              RENDER: {(typeof window !== 'undefined' ? window.devicePixelRatio : 1).toFixed(1)}x
            </span>
          </motion.div>
        </div>

        {/* RIGHT: Related panels */}
        <div className="space-y-3">
          <AnimatePresence>
            {rightOpen && (
              <>
                {siblings.slice(0, 4).map((sibling, i) => (
                  <motion.div
                    key={sibling.id}
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30, delay: i * 0.05 }}
                  >
                    <SatellitePanel
                      id={sibling.id}
                      title={sibling.title}
                      type="sibling"
                      href={sibling.path}
                      position="right"
                      isOpen={true}
                      onToggle={() => setRightOpen(false)}
                    >
                      {sibling.preview}
                    </SatellitePanel>
                  </motion.div>
                ))}
              </>
            )}
          </AnimatePresence>

          {!rightOpen && siblings.length > 0 && (
            <button
              onClick={() => setRightOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-xs hover:bg-cyan-500/10 transition-all ml-auto"
            >
              Related
              <ChevronLeft className="w-3 h-3" />
            </button>
          )}

          {siblings.length === 0 && !isNavigation && (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-center">
              <Wrench className="w-5 h-5 text-white/20 mx-auto mb-2" />
              <p className="text-xs text-white/30 font-mono">NO RELATED</p>
            </div>
          )}
        </div>
      </div>

      {/* Global scanline animation style */}
      <style jsx global>{`
        @keyframes scanline {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
      `}</style>
    </div>
  );
}

function HUDCorner({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) {
  const positions = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const lines = {
    'top-left': 'border-t border-l',
    'top-right': 'border-t border-r',
    'bottom-left': 'border-b border-l',
    'bottom-right': 'border-b border-r',
  };

  return (
    <div className={`absolute ${positions[position]} z-40 pointer-events-none`}>
      <div className={`w-8 h-8 ${lines[position]} border-cyan-500/30 rounded-${position.includes('top') ? 't' : 'b'}${position.includes('left') ? 'l' : 'r'}`} />
    </div>
  );
}
