'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

interface WiringDiagram {
  name: string;
  url: string;
  subPath?: string;
}

interface WiringSystem {
  system: string;
  diagrams: WiringDiagram[];
}

interface JarvisWiringOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleInfo: {
    make?: string;
    year?: string;
    model?: string;
  };
}

export default function JarvisWiringOverlay({
  isOpen,
  onClose,
  vehicleInfo,
}: JarvisWiringOverlayProps) {
  const [systems, setSystems] = useState<WiringSystem[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [selectedDiagram, setSelectedDiagram] = useState<WiringDiagram | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const activeSystem = selectedSystem
    ? systems.find((s) => s.system === selectedSystem)
    : null;

  const fetchDiagrams = useCallback(async () => {
    if (!vehicleInfo.make || !vehicleInfo.year || !vehicleInfo.model) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(
        `/api/wiring?action=diagrams&make=${encodeURIComponent(vehicleInfo.make)}&year=${encodeURIComponent(vehicleInfo.year)}&variant=${encodeURIComponent(vehicleInfo.model)}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSystems(data.systems || []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load');
      setSystems([]);
    } finally {
      setLoading(false);
    }
  }, [vehicleInfo.make, vehicleInfo.year, vehicleInfo.model]);

  useEffect(() => {
    if (isOpen) {
      fetchDiagrams();
    } else {
      setSelectedSystem(null);
      setSelectedDiagram(null);
      setSystems([]);
      setLoadError(null);
    }
  }, [isOpen, fetchDiagrams]);

  async function loadDiagramImages(url: string) {
    if (imageUrls[url]) return;
    setImageUrls((prev) => ({ ...prev, [url]: [] }));
    try {
      const res = await fetch(`/api/wiring?action=image&url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setImageUrls((prev) => ({ ...prev, [url]: data.images || [] }));
    } catch {
      setImageUrls((prev) => ({ ...prev, [url]: [] }));
    }
  }

  const vehicleLabel = vehicleInfo.year && vehicleInfo.make && vehicleInfo.model
    ? `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`
    : 'Vehicle';

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
          <div className="absolute inset-4 border border-violet-500/20 rounded-2xl pointer-events-none" />
          <div className="absolute top-4 left-8 px-3 py-1 bg-[#050507] text-[10px] font-mono text-violet-400/60 uppercase tracking-widest">
            Wiring Diagram Archive
          </div>

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between px-8 pt-8 pb-4">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-violet-400" />
              <div>
                <h2 className="text-lg font-display font-bold text-white">Wiring Diagrams</h2>
                <p className="text-xs text-white/40 font-mono">{vehicleLabel}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all text-xs text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
              CLOSE
            </button>
          </div>

          {/* Content */}
          <div className="relative z-10 px-8 pb-8 h-[calc(100vh-120px)] overflow-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-white/30">
                <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin mb-4" />
                <span className="text-xs font-mono">ACCESSING WIRING ARCHIVE...</span>
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center justify-center h-full text-white/20">
                <Zap className="w-10 h-10 mb-4 opacity-30" />
                <p className="text-sm font-mono">{loadError}</p>
                <button
                  onClick={fetchDiagrams}
                  className="mt-4 px-4 py-2 rounded-lg border border-white/10 hover:border-violet-500/40 hover:text-violet-400 transition-all text-xs font-mono"
                >
                  RETRY
                </button>
              </div>
            ) : systems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/20">
                <Zap className="w-10 h-10 mb-4 opacity-30" />
                <p className="text-sm font-mono">NO WIRING DIAGRAMS FOUND</p>
                <p className="text-xs text-white/10 mt-2">This vehicle may not have indexed wiring data yet</p>
              </div>
            ) : !selectedSystem ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {systems.map((system, i) => (
                  <motion.button
                    key={system.system}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedSystem(system.system)}
                    className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-5 text-left hover:border-violet-500/40 hover:bg-violet-500/[0.03] transition-all"
                  >
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">
                        {system.system}
                      </span>
                      <span className="text-[10px] font-mono text-white/30 px-2 py-0.5 rounded-full bg-white/5">
                        {system.diagrams.length}
                      </span>
                    </div>
                    <p className="text-xs text-white/30 font-mono truncate">
                      {system.diagrams.slice(0, 3).map((d) => d.name).join(' · ')}
                      {system.diagrams.length > 3 && ' · ...'}
                    </p>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setSelectedSystem(null);
                    setSelectedDiagram(null);
                  }}
                  className="flex items-center gap-2 text-xs text-white/40 hover:text-violet-400 transition-colors font-mono"
                >
                  <ChevronLeft className="w-3 h-3" />
                  ALL SYSTEMS
                </button>

                <h3 className="text-xl font-display font-bold text-white mb-4">{selectedSystem}</h3>

                {selectedDiagram ? (
                  <DiagramViewer
                    diagram={selectedDiagram}
                    images={imageUrls[selectedDiagram.url] || []}
                    onBack={() => setSelectedDiagram(null)}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeSystem?.diagrams.map((diagram, i) => (
                      <motion.button
                        key={diagram.url}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => {
                          setSelectedDiagram(diagram);
                          loadDiagramImages(diagram.url);
                        }}
                        className="group text-left p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:border-violet-500/40 hover:bg-violet-500/[0.03] transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white/70 group-hover:text-white transition-colors">
                            {diagram.name}
                          </span>
                          <Maximize2 className="w-3 h-3 text-white/20 group-hover:text-violet-400 transition-colors" />
                        </div>
                        <span className="text-[10px] text-white/20 font-mono mt-1 block truncate">
                          {diagram.subPath || diagram.url}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DiagramViewer({
  diagram,
  images,
  onBack,
}: {
  diagram: WiringDiagram;
  images: string[];
  onBack: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
    setImgLoaded(false);
  }, [diagram.url]);

  const hasImages = images.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-2xl border border-violet-500/20 bg-[#0a0a12] overflow-hidden"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs text-white/40 hover:text-violet-400 transition-colors font-mono"
        >
          <ChevronLeft className="w-3 h-3" />
          BACK
        </button>
        <span className="text-xs text-white/40 font-mono truncate max-w-[300px]">{diagram.name}</span>
        {images.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="p-1 rounded hover:bg-white/5 disabled:opacity-30 transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-white/60" />
            </button>
            <span className="text-[10px] text-white/30 font-mono">
              {currentIndex + 1} / {images.length}
            </span>
            <button
              onClick={() => setCurrentIndex((i) => Math.min(images.length - 1, i + 1))}
              disabled={currentIndex >= images.length - 1}
              className="p-1 rounded hover:bg-white/5 disabled:opacity-30 transition-all"
            >
              <ChevronRight className="w-4 h-4 text-white/60" />
            </button>
          </div>
        )}
      </div>

      {/* Image */}
      <div className="relative flex items-center justify-center min-h-[400px] p-4">
        {!hasImages ? (
          <div className="flex flex-col items-center gap-3 text-white/30">
            <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
            <span className="text-xs font-mono">LOADING DIAGRAM...</span>
          </div>
        ) : images.length === 0 || !images[currentIndex] ? (
          <div className="text-center text-white/20">
            <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-mono">NO IMAGES AVAILABLE</p>
          </div>
        ) : (
          <div className="relative">
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[currentIndex]}
              alt={diagram.name}
              onLoad={() => setImgLoaded(true)}
              className={`max-w-full max-h-[70vh] object-contain rounded-lg border border-white/5 transition-opacity ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
