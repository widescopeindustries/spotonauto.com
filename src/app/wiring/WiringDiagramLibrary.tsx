'use client';

import React, { useDeferredValue, useState, useEffect, useCallback, useRef } from 'react';
import {
  trackWiringDiagramExit,
  trackWiringDiagramInteract,
  trackWiringDiagramOpen,
  trackWiringDiagramSearch,
  trackWiringSystemToggle,
} from '@/lib/analytics';
import type { WiringSelectorData } from '@/lib/wiringCoverage';
import AffiliateLink from '@/components/AffiliateLink';
import { buildAmazonSearchUrl } from '@/lib/amazonAffiliate';

interface DiagramEntry {
  name: string;
  url: string;
}

interface DiagramSystem {
  system: string;
  diagrams: DiagramEntry[];
}

interface DiagramData {
  vehicle: string;
  systems: DiagramSystem[];
  totalDiagrams: number;
}

interface DiagramImage {
  images: string[];
  title: string;
}

const DIAGRAM_WATERMARK_SRC = '/diagram-watermark.svg';

function normalizeModelText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const VARIANT_NOISE_TOKENS = new Set([
  '2wd',
  '4wd',
  'awd',
  'fwd',
  'rwd',
  '4x4',
  '2x4',
  'lwb',
  'swb',
  'xl',
  'xlt',
  'base',
  'sport',
  'limited',
  'premium',
  'sedan',
  'coupe',
  'wagon',
  'hatchback',
  'suv',
]);

function normalizeVariantCore(value: string): string {
  return normalizeModelText(value)
    .split(' ')
    .filter((token) => token.length > 1 && !VARIANT_NOISE_TOKENS.has(token))
    .join(' ')
    .trim();
}

function scoreTextMatch(candidate: string, needle: string): number {
  const candidateNorm = normalizeModelText(candidate);
  const needleNorm = normalizeModelText(needle);
  const candidateCore = normalizeVariantCore(candidate);
  const needleCore = normalizeVariantCore(needle);
  if (!candidateNorm || !needleNorm) return 0;

  if (candidateNorm === needleNorm) return 100;
  if (candidateCore && needleCore && candidateCore === needleCore) return 98;
  if (candidateNorm.startsWith(`${needleNorm} `)) return 95;
  if (candidateNorm.includes(` ${needleNorm} `)) return 88;
  if (candidateNorm.includes(needleNorm)) return 80;
  if (candidateCore && needleCore && candidateCore.includes(needleCore)) return 84;

  let tokenHits = 0;
  for (const token of needleCore.split(' ')) {
    if (token.length > 1 && candidateNorm.includes(token)) tokenHits += 1;
  }
  if (tokenHits > 0) return 45 + tokenHits * 10;

  const needleHead = needleCore.split(' ')[0];
  if (needleHead && needleHead.length > 2 && candidateCore.includes(needleHead)) return 42;
  return 0;
}

function resolveBestMatch(options: string[], needle: string): string | null {
  let bestVariant: string | null = null;
  let bestScore = 0;

  for (const variant of options) {
    const score = scoreTextMatch(variant, needle);
    if (score > bestScore) {
      bestScore = score;
      bestVariant = variant;
    }
  }

  return bestScore >= 42 ? bestVariant : null;
}

function resolveVariantForModel(variants: string[], model: string): string | null {
  return resolveBestMatch(variants, model);
}

function resolveModelForVariant(models: string[], variant: string): string | null {
  return resolveBestMatch(models, variant);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Unable to load image: ${src}`));
    img.src = src;
  });
}

async function composeWatermarkedDiagram(sourceBlob: Blob): Promise<Blob> {
  const [diagramUrl, watermarkUrl] = [URL.createObjectURL(sourceBlob), DIAGRAM_WATERMARK_SRC];

  try {
    const [diagramImage, watermarkImage] = await Promise.all([
      loadImage(diagramUrl),
      loadImage(watermarkUrl),
    ]);

    const canvas = document.createElement('canvas');
    canvas.width = diagramImage.naturalWidth;
    canvas.height = diagramImage.naturalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    ctx.drawImage(diagramImage, 0, 0);

    const { width, height } = canvas;
    const bandWidth = Math.max(72, Math.round(Math.min(width, height) * 0.075));
    const bandPadding = Math.max(8, Math.round(bandWidth * 0.12));
    const watermarkWidth = Math.max(40, bandWidth - bandPadding * 2);
    const watermarkHeight = Math.round((watermarkImage.naturalHeight / watermarkImage.naturalWidth) * watermarkWidth);
    const watermarkY = Math.round((height - watermarkHeight) / 2);
    const watermarkX = bandPadding;

    const paintBand = (x: number) => {
      const gradient = ctx.createLinearGradient(x, 0, x + bandWidth, 0);
      gradient.addColorStop(0, 'rgba(249, 253, 255, 0.90)');
      gradient.addColorStop(0.55, 'rgba(249, 253, 255, 0.72)');
      gradient.addColorStop(1, 'rgba(249, 253, 255, 0.14)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, 0, bandWidth, height);
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.38)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, 0.5, bandWidth - 1, height - 1);
    };

    paintBand(0);
    paintBand(width - bandWidth);

    ctx.save();
    ctx.globalAlpha = 0.96;
    ctx.drawImage(
      watermarkImage,
      watermarkX,
      watermarkY,
      watermarkWidth,
      watermarkHeight,
    );
    ctx.drawImage(
      watermarkImage,
      width - bandWidth + watermarkX,
      watermarkY,
      watermarkWidth,
      watermarkHeight,
    );
    ctx.restore();

    const output = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (!result) {
          reject(new Error('Watermark export failed'));
          return;
        }
        resolve(result);
      }, 'image/png');
    });

    return output;
  } finally {
    URL.revokeObjectURL(diagramUrl);
  }
}

function WiringDiagramAffiliateStrip({ vehicle }: { vehicle: string }) {
  const tools = [
    {
      name: 'Multimeter',
      query: `${vehicle} multimeter automotive`,
      reason: 'Test voltage, continuity & grounds',
    },
    {
      name: 'Test Light',
      query: `${vehicle} test light circuit tester`,
      reason: 'Quick power & ground checks',
    },
    {
      name: 'Wire Strippers',
      query: `${vehicle} wire stripper crimper set`,
      reason: 'Repair harnesses & connectors',
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] uppercase tracking-[0.16em] text-cyan-300/70 mr-1">
        Tracing this circuit?
      </span>
      {tools.map((tool) => (
        <AffiliateLink
          key={tool.name}
          href={buildAmazonSearchUrl(tool.query, 'automotive', 'wiring-modal-tool')}
          partName={tool.name}
          vehicle={vehicle || 'AllOEMManuals'}
          pageType="parts_page"
          subtag="wiring-modal-tool"
          className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/25 bg-cyan-400/[0.08] px-3 py-1 text-xs font-medium text-cyan-100 hover:border-cyan-400/50 hover:bg-cyan-400/[0.14] transition"
        >
          {tool.name}
          <span className="text-[10px] text-cyan-200/60 hidden sm:inline">{tool.reason}</span>
        </AffiliateLink>
      ))}
    </div>
  );
}

interface WiringDiagramLibraryProps {
  selectorData: WiringSelectorData;
}

export default function WiringDiagramLibrary({ selectorData }: WiringDiagramLibraryProps) {
  const [variants, setVariants] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');

  // Diagram state
  const [diagramData, setDiagramData] = useState<DiagramData | null>(null);
  const [expandedSystem, setExpandedSystem] = useState<string | null>(null);
  const [selectedDiagram, setSelectedDiagram] = useState<{ entry: DiagramEntry; images: DiagramImage } | null>(null);
  const [search, setSearch] = useState('');
  const [diagramZoom, setDiagramZoom] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [variantLookupError, setVariantLookupError] = useState<string | null>(null);
  const [diagramError, setDiagramError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  // Loading states
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [loadingDiagrams, setLoadingDiagrams] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const prefillVariantRef = useRef<string>('');
  const prefillModelRef = useRef<string>('');
  const autoOpenRef = useRef(false);
  const autoOpenConsumedRef = useRef(false);
  const searchTrackRef = useRef('');
  const modalRef = useRef<HTMLDivElement>(null);
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const pinchStartRef = useRef<{ dist: number; zoom: number } | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const openTimeRef = useRef<number>(0);
  const zoomTrackTimerRef = useRef<number>(0);

  const makes = selectedYear ? selectorData.makesByYear[selectedYear] || [] : [];
  const models = selectedYear && selectedMake
    ? selectorData.modelsByYearMake[`${selectedYear}:${selectedMake}`] || []
    : [];
  const deferredSearch = useDeferredValue(search);

  // Read optional query params for deep links from SEO pages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const year = params.get('year');
    const make = params.get('make');
    const variant = params.get('variant');
    const model = params.get('model');
    const query = params.get('q');
    const open = params.get('open');

    if (year) setSelectedYear(year);
    if (make) setSelectedMake(make);
    if (model) setSelectedModel(model);
    if (variant) prefillVariantRef.current = variant;
    if (model) prefillModelRef.current = model;
    if (query) setSearch(query);
    autoOpenRef.current = open === '1';
    autoOpenConsumedRef.current = false;
  }, []);

  // Clear downstream when year changes
  const handleYearChange = useCallback((year: string) => {
    setSelectedYear(year);
    setSelectedMake('');
    setSelectedModel('');
    setSelectedVariant('');
    setVariants([]);
    setDiagramData(null);
    setExpandedSystem(null);
    setSelectedDiagram(null);
    setVariantLookupError(null);
    setDiagramError(null);
    autoOpenConsumedRef.current = false;
  }, []);

  // Clear downstream when make changes
  const handleMakeChange = useCallback((make: string) => {
    setSelectedMake(make);
    setSelectedModel('');
    setSelectedVariant('');
    setVariants([]);
    setDiagramData(null);
    setExpandedSystem(null);
    setSelectedDiagram(null);
    setVariantLookupError(null);
    setDiagramError(null);
    autoOpenConsumedRef.current = false;
  }, []);

  const handleModelChange = useCallback((model: string) => {
    setSelectedModel(model);
    setSelectedVariant('');
    setDiagramData(null);
    setExpandedSystem(null);
    setSelectedDiagram(null);
    setVariantLookupError(null);
    setDiagramError(null);
    autoOpenConsumedRef.current = false;
  }, []);

  // Fetch variants when make + year both selected
  useEffect(() => {
    if (!selectedMake || !selectedYear) {
      setVariants([]);
      setSelectedVariant('');
      return;
    }
    setLoadingVariants(true);
    setSelectedVariant('');
    setDiagramData(null);
    setVariantLookupError(null);
    void fetch(`/api/wiring?action=variants&make=${encodeURIComponent(selectedMake)}&year=${selectedYear}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          throw new Error(data.error || 'Unable to load archive variants');
        }
        return data;
      })
      .then(d => {
        const loadedVariants: string[] = d.variants || [];
        setVariants(loadedVariants);
        setLoadingVariants(false);
      })
      .catch((error: unknown) => {
        setVariants([]);
        setLoadingVariants(false);
        setVariantLookupError(error instanceof Error ? error.message : 'Unable to load archive variants');
      });
  }, [selectedMake, selectedYear]);

  useEffect(() => {
    if (!selectedYear || !selectedMake || loadingVariants) return;
    if (variants.length === 0) {
      setSelectedVariant('');
      return;
    }

    let nextModel = selectedModel;

    if (!nextModel && prefillModelRef.current) {
      nextModel = prefillModelRef.current;
      setSelectedModel(prefillModelRef.current);
    }

    if (!nextModel && prefillVariantRef.current && models.length > 0) {
      const inferredModel = resolveModelForVariant(models, prefillVariantRef.current);
      if (inferredModel) {
        nextModel = inferredModel;
        setSelectedModel(inferredModel);
      }
    }

    const matchedVariant = prefillVariantRef.current && variants.includes(prefillVariantRef.current)
      ? prefillVariantRef.current
      : nextModel
        ? resolveVariantForModel(variants, nextModel)
        : null;

    setSelectedVariant(matchedVariant || '');

    if (matchedVariant) {
      prefillVariantRef.current = '';
      prefillModelRef.current = '';
    }
  }, [loadingVariants, models, selectedMake, selectedModel, selectedYear, variants]);

  const archiveTarget = selectedVariant || (selectedModel && !loadingVariants ? selectedModel : '');
  const isUsingDirectModelFallback = Boolean(!selectedVariant && archiveTarget && selectedModel);

  // Fetch diagrams when variant changes
  useEffect(() => {
    if (!selectedMake || !selectedYear || !selectedModel || !archiveTarget) return;
    setLoadingDiagrams(true);
    setDiagramData(null);
    setExpandedSystem(null);
    setSelectedDiagram(null);
    setDiagramError(null);
    void fetch(`/api/wiring?action=diagrams&make=${encodeURIComponent(selectedMake)}&year=${selectedYear}&variant=${encodeURIComponent(archiveTarget)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          throw new Error(data.error || 'Unable to load diagram index');
        }
        return data;
      })
      .then(d => {
        setDiagramData(d);
        setLoadingDiagrams(false);
      })
      .catch((error: unknown) => {
        setLoadingDiagrams(false);
        setDiagramError(error instanceof Error ? error.message : 'Unable to load diagram index');
      });
  }, [archiveTarget, selectedMake, selectedModel, selectedYear]);

  const openDiagram = useCallback(async (entry: DiagramEntry, systemName: string) => {
    setLoadingImage(true);
    setSelectedDiagram({ entry, images: { images: [], title: entry.name } });
    openTimeRef.current = Date.now();
    try {
      const resp = await fetch(`/api/wiring?action=image&url=${encodeURIComponent(entry.url)}`);
      const data = await resp.json();
      const images = Array.isArray(data.images) ? data.images : [];
      const title = data.title || entry.name;
      setSelectedDiagram({ entry, images: { images, title } });
      if (selectedYear && selectedMake && (selectedModel || selectedVariant)) {
        trackWiringDiagramOpen(
          `${selectedYear} ${selectedMake} ${selectedModel || selectedVariant}`,
          systemName,
          entry.name,
        );
      }
    } catch {
      setSelectedDiagram({ entry, images: { images: [], title: entry.name } });
    }
    setLoadingImage(false);
  }, [selectedMake, selectedVariant, selectedYear]);

  // Filter systems/diagrams by search term
  const filteredSystems = diagramData?.systems
    .map(sys => ({
      ...sys,
      diagrams: deferredSearch
        ? sys.diagrams.filter(d => d.name.toLowerCase().includes(deferredSearch.toLowerCase()))
        : sys.diagrams,
    }))
    .filter(sys => deferredSearch ? sys.diagrams.length > 0 : true) || [];

  const filteredCount = filteredSystems.reduce((sum, s) => sum + s.diagrams.length, 0);
  const currentVehicleLabel = selectedYear && selectedMake
    ? `${selectedYear} ${selectedMake} ${selectedModel || selectedVariant || ''}`.trim()
    : '';
  const currentDiagram = selectedDiagram?.images.images[selectedImageIndex] || '';

  const buildDiagramShareUrl = useCallback((includeDiagram = true) => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    if (selectedYear) url.searchParams.set('year', selectedYear);
    if (selectedMake) url.searchParams.set('make', selectedMake);
    if (selectedModel) url.searchParams.set('model', selectedModel);
    if (selectedVariant) url.searchParams.set('variant', selectedVariant);
    if (selectedDiagram && includeDiagram) {
      url.searchParams.set('q', selectedDiagram.entry.name);
      url.searchParams.set('open', '1');
    } else if (search) {
      url.searchParams.set('q', search);
    }
    return url.toString();
  }, [search, selectedDiagram, selectedMake, selectedModel, selectedVariant, selectedYear]);

  const closeDiagram = useCallback((reason: 'close_button' | 'backdrop' | 'escape') => {
    if (selectedDiagram) {
      const durationMs = openTimeRef.current ? Date.now() - openTimeRef.current : undefined;
      trackWiringDiagramExit({
        vehicle: currentVehicleLabel,
        system: expandedSystem || 'diagram-library',
        kind: reason,
        openDiagrams: selectedDiagram.images.images.length,
        durationMs,
      });
    }
    openTimeRef.current = 0;
    setSelectedDiagram(null);
  }, [
    currentVehicleLabel,
    expandedSystem,
    selectedDiagram,
  ]);

  useEffect(() => {
    const query = deferredSearch.trim();
    if (!currentVehicleLabel || !query) return;
    if (searchTrackRef.current === query) return;

    const timer = window.setTimeout(() => {
      searchTrackRef.current = query;
      trackWiringDiagramSearch({
        vehicle: currentVehicleLabel,
        system: expandedSystem || 'diagram-library',
        query,
        resultCount: filteredCount,
        scope: expandedSystem ? 'system_list' : 'diagram_library',
      });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [
    currentVehicleLabel,
    deferredSearch,
    expandedSystem,
    filteredCount,
    selectedMake,
    selectedModel,
    selectedVariant,
    selectedYear,
  ]);

  useEffect(() => {
    if (!deferredSearch || filteredSystems.length === 0) return;
    if (expandedSystem && filteredSystems.some(sys => sys.system === expandedSystem)) return;
    setExpandedSystem(filteredSystems[0].system);
  }, [deferredSearch, expandedSystem, filteredSystems]);

  useEffect(() => {
    if (!autoOpenRef.current || autoOpenConsumedRef.current) return;
    if (loadingDiagrams || loadingImage || selectedDiagram) return;

    // Try to find a diagram matching the ?q= query param first
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q')?.toLowerCase().trim();
    let targetSystem = filteredSystems[0];
    let targetDiagram = targetSystem?.diagrams[0];

    if (query) {
      for (const sys of filteredSystems) {
        const match = sys.diagrams.find(d => d.name.toLowerCase().includes(query));
        if (match) {
          targetSystem = sys;
          targetDiagram = match;
          break;
        }
      }
    }

    if (!targetSystem || !targetDiagram) return;

    autoOpenConsumedRef.current = true;
    setExpandedSystem(targetSystem.system);
    void openDiagram(targetDiagram, targetSystem.system);
  }, [filteredSystems, loadingDiagrams, loadingImage, openDiagram, selectedDiagram]);

  useEffect(() => {
    if (!selectedDiagram) return;
    setDiagramZoom(1);
    setSelectedImageIndex(0);
    setPanX(0);
    setPanY(0);
  }, [selectedDiagram]);

  // Focus trap + initial focus when modal opens
  useEffect(() => {
    if (!selectedDiagram || !modalRef.current) return;
    // Focus the close button when modal opens
    closeBtnRef.current?.focus();

    const modal = modalRef.current;
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const focusables = Array.from(modal.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        el => !el.hasAttribute('disabled') && el.offsetParent !== null
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [selectedDiagram]);

  // Wheel zoom + drag pan + pinch zoom handlers
  const handleWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.12 : 0.12;
    const nextZoom = Math.max(0.5, Math.min(3.5, diagramZoom + delta));
    setDiagramZoom(nextZoom);
    if (nextZoom <= 1) {
      setPanX(0);
      setPanY(0);
    }
    // Debounced zoom tracking for wheel
    window.clearTimeout(zoomTrackTimerRef.current);
    zoomTrackTimerRef.current = window.setTimeout(() => {
      if (selectedDiagram) {
        trackWiringDiagramInteract({
          vehicle: currentVehicleLabel,
          system: expandedSystem || 'diagram-library',
          action: delta > 0 ? 'zoom_in' : 'zoom_out',
          diagramName: selectedDiagram.entry.name,
          interactionTarget: 'wheel_zoom',
        });
      }
    }, 400);
  }, [diagramZoom, selectedDiagram, currentVehicleLabel, expandedSystem]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (diagramZoom <= 1) return;
    event.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: event.clientX, y: event.clientY, panX, panY };
    if (selectedDiagram) {
      trackWiringDiagramInteract({
        vehicle: currentVehicleLabel,
        system: expandedSystem || 'diagram-library',
        action: 'pan_start',
        diagramName: selectedDiagram.entry.name,
        interactionTarget: 'mouse_pan',
      });
    }
  }, [diagramZoom, panX, panY, selectedDiagram, currentVehicleLabel, expandedSystem]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    event.preventDefault();
    const start = dragStartRef.current;
    setPanX(start.panX + (event.clientX - start.x));
    setPanY(start.panY + (event.clientY - start.y));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (event.touches.length === 2) {
      // Pinch start
      const t1 = event.touches[0];
      const t2 = event.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      pinchStartRef.current = { dist, zoom: diagramZoom };
    } else if (event.touches.length === 1 && diagramZoom > 1) {
      // Pan start
      const t = event.touches[0];
      setIsDragging(true);
      dragStartRef.current = { x: t.clientX, y: t.clientY, panX, panY };
      if (selectedDiagram) {
        trackWiringDiagramInteract({
          vehicle: currentVehicleLabel,
          system: expandedSystem || 'diagram-library',
          action: 'pan_start',
          diagramName: selectedDiagram.entry.name,
          interactionTarget: 'touch_pan',
        });
      }
    }
  }, [diagramZoom, panX, panY]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (event.touches.length === 2 && pinchStartRef.current) {
      event.preventDefault();
      const t1 = event.touches[0];
      const t2 = event.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const scale = dist / pinchStartRef.current.dist;
      const nextZoom = Math.max(0.5, Math.min(3.5, pinchStartRef.current.zoom * scale));
      setDiagramZoom(nextZoom);
      if (nextZoom <= 1) {
        setPanX(0);
        setPanY(0);
      }
      // Debounced zoom tracking for pinch
      window.clearTimeout(zoomTrackTimerRef.current);
      zoomTrackTimerRef.current = window.setTimeout(() => {
        if (selectedDiagram) {
          trackWiringDiagramInteract({
            vehicle: currentVehicleLabel,
            system: expandedSystem || 'diagram-library',
            action: scale > 1 ? 'zoom_in' : 'zoom_out',
            diagramName: selectedDiagram.entry.name,
            interactionTarget: 'pinch_zoom',
          });
        }
      }, 400);
    } else if (event.touches.length === 1 && isDragging && dragStartRef.current) {
      event.preventDefault();
      const t = event.touches[0];
      const start = dragStartRef.current;
      setPanX(start.panX + (t.clientX - start.x));
      setPanY(start.panY + (t.clientY - start.y));
    }
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
    pinchStartRef.current = null;
  }, []);

  const updateZoom = useCallback((nextZoom: number, action: 'zoom_in' | 'zoom_out' | 'reset_zoom') => {
    const boundedZoom = Math.max(0.5, Math.min(3.5, nextZoom));
    setDiagramZoom(boundedZoom);
    if (boundedZoom <= 1) {
      setPanX(0);
      setPanY(0);
    }
    if (selectedDiagram) {
      trackWiringDiagramInteract({
        vehicle: currentVehicleLabel,
        system: expandedSystem || 'diagram-library',
        action,
        diagramName: selectedDiagram.entry.name,
        interactionTarget: 'modal_zoom',
      });
    }
  }, [
    currentVehicleLabel,
    expandedSystem,
    selectedDiagram,
    selectedMake,
    selectedModel,
    selectedVariant,
    selectedYear,
  ]);

  // Keyboard navigation for modal
  useEffect(() => {
    if (!selectedDiagram) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDiagram('escape');
        return;
      }
      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        updateZoom(diagramZoom + 0.2, 'zoom_in');
        return;
      }
      if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        updateZoom(diagramZoom - 0.2, 'zoom_out');
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (selectedImageIndex > 0) {
          const nextIndex = selectedImageIndex - 1;
          setSelectedImageIndex(nextIndex);
          trackWiringDiagramInteract({
            vehicle: currentVehicleLabel,
            system: expandedSystem || 'diagram-library',
            action: 'image_prev',
            diagramName: selectedDiagram.entry.name,
            interactionTarget: 'image_pager',
          });
        }
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (selectedDiagram.images.images.length > 1 && selectedImageIndex < selectedDiagram.images.images.length - 1) {
          const nextIndex = selectedImageIndex + 1;
          setSelectedImageIndex(nextIndex);
          trackWiringDiagramInteract({
            vehicle: currentVehicleLabel,
            system: expandedSystem || 'diagram-library',
            action: 'image_next',
            diagramName: selectedDiagram.entry.name,
            interactionTarget: 'image_pager',
          });
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeDiagram, diagramZoom, selectedDiagram, selectedImageIndex, updateZoom, currentVehicleLabel, expandedSystem, selectedMake, selectedModel, selectedVariant, selectedYear]);

  const handleCopyLink = useCallback(async () => {
    const shareUrl = buildDiagramShareUrl(true);
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyStatus('Link copied');
    } catch {
      setCopyStatus('Copy failed');
    }
    if (selectedDiagram) {
      trackWiringDiagramInteract({
        vehicle: currentVehicleLabel,
        system: expandedSystem || 'diagram-library',
        action: 'copy_link',
        diagramName: selectedDiagram.entry.name,
        interactionTarget: 'share_link',
      });
    }
    window.setTimeout(() => setCopyStatus(null), 1800);
  }, [
    buildDiagramShareUrl,
    currentVehicleLabel,
    expandedSystem,
    selectedDiagram,
    selectedMake,
    selectedModel,
    selectedVariant,
    selectedYear,
  ]);

  const handleShare = useCallback(async () => {
    const shareUrl = buildDiagramShareUrl(true);
    if (!shareUrl) return;
    if (selectedDiagram) {
      trackWiringDiagramInteract({
        vehicle: currentVehicleLabel,
        system: expandedSystem || 'diagram-library',
        action: 'share',
        diagramName: selectedDiagram.entry.name,
        interactionTarget: 'share_link',
      });
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: selectedDiagram?.entry.name || 'Wiring diagram',
          url: shareUrl,
        });
        setCopyStatus('Shared');
        window.setTimeout(() => setCopyStatus(null), 1800);
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setCopyStatus('Link copied');
    } catch {
      setCopyStatus('Share unavailable');
    }
    window.setTimeout(() => setCopyStatus(null), 1800);
  }, [
    buildDiagramShareUrl,
    currentVehicleLabel,
    expandedSystem,
    selectedDiagram,
    selectedMake,
    selectedModel,
    selectedVariant,
    selectedYear,
  ]);

  const handleDownload = useCallback(async () => {
    if (!currentDiagram) return;
    if (selectedDiagram) {
      trackWiringDiagramInteract({
        vehicle: currentVehicleLabel,
        system: expandedSystem || 'diagram-library',
        action: 'download',
        diagramName: selectedDiagram.entry.name,
        interactionTarget: 'diagram_image',
      });
    }

    try {
      const response = await fetch(currentDiagram);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const exportBlob = await composeWatermarkedDiagram(blob);
      const objectUrl = URL.createObjectURL(exportBlob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `${selectedDiagram?.entry.name || 'wiring-diagram'}.png`.replace(/[^a-z0-9._-]+/gi, '_');
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
    } catch {
      setCopyStatus('Download unavailable');
      window.setTimeout(() => setCopyStatus(null), 1800);
    }
  }, [
    currentDiagram,
    currentVehicleLabel,
    expandedSystem,
    selectedDiagram,
    selectedMake,
    selectedModel,
    selectedVariant,
    selectedYear,
  ]);

  return (
    <div className="wiring-library">
      {/* Header */}
      <header className="wl-header">
        <div className="wl-header-inner">
          <div className="wl-badge">FACTORY SERVICE MANUAL</div>
          <h1 className="wl-title">Wiring Diagram Library</h1>
          <p className="wl-subtitle">
            Original factory wiring diagrams, connector views, and electrical schematics.
            <br />Coverage: 1982&ndash;2025 &middot; All makes and models.
          </p>
        </div>
      </header>

      <main className="wl-main" id="diagram-browser">
        {/* Vehicle Selector */}
        <div className="wl-selector">
          <h2 className="wl-selector-title">Select Your Vehicle</h2>
          <div className="wl-dropdowns">
            <div className="wl-dropdown-group">
              <label className="wl-label">Year</label>
              <select
                className="wl-select"
                value={selectedYear}
                onChange={e => handleYearChange(e.target.value)}
              >
                <option value="">Select Year</option>
                {selectorData.years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="wl-dropdown-group">
              <label className="wl-label">Make</label>
              <select
                className="wl-select"
                value={selectedMake}
                onChange={e => handleMakeChange(e.target.value)}
                disabled={!selectedYear}
              >
                <option value="">{selectedYear ? 'Select Make' : 'Select Year First'}</option>
                {makes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="wl-dropdown-group">
              <label className="wl-label">Model</label>
              <select
                className="wl-select"
                value={selectedModel}
                onChange={e => handleModelChange(e.target.value)}
                disabled={!selectedYear || !selectedMake}
              >
                <option value="">
                  {!selectedYear ? 'Select Year First' : !selectedMake ? 'Select Make First' : 'Select Model'}
                </option>
                {models.map(model => <option key={model} value={model}>{model}</option>)}
              </select>
            </div>
          </div>

          {selectedYear && makes.length === 0 && (
            <p className="wl-hint">No verified wiring coverage is available for {selectedYear}.</p>
          )}
          {selectedYear && selectedMake && models.length === 0 && (
            <p className="wl-hint">No verified wiring model coverage is available for {selectedYear} {selectedMake}.</p>
          )}
          {variantLookupError && (
            <p className="wl-hint wl-hint-warn">Archive variant lookup is unavailable right now. Trying the direct model path instead.</p>
          )}
          {selectedYear && selectedMake && selectedModel && !loadingVariants && !selectedVariant && !variantLookupError && !loadingDiagrams && !diagramData && !diagramError && (
            <p className="wl-hint">No exact archive variant match yet. Trying the closest compatible variant for this model.</p>
          )}
          {isUsingDirectModelFallback && !loadingDiagrams && diagramData && (
            <p className="wl-hint">Opened diagrams using the direct model path because no engine-specific variant was required.</p>
          )}
          {diagramError && (
            <p className="wl-hint wl-hint-warn">Could not load the diagram index for {selectedYear} {selectedMake} {selectedModel}. The archive may be unavailable for that model right now.</p>
          )}
        </div>

        {/* Loading */}
        {loadingDiagrams && (
          <div className="wl-loading">
            <div className="wl-spinner" />
            <p>Loading diagram index...</p>
          </div>
        )}

        {/* Diagram Browser */}
        {diagramData && !loadingDiagrams && (
          <div className="wl-browser">
            <div className="wl-browser-header">
              <div>
                <h2 className="wl-browser-title">{diagramData.vehicle}</h2>
                <p className="wl-browser-count">
                  {filteredCount} diagram{filteredCount !== 1 ? 's' : ''} available
                  {search && ` (filtered from ${diagramData.totalDiagrams})`}
                </p>
              </div>
              <div className="wl-search-wrap">
                <input
                  type="text"
                  className="wl-search"
                  placeholder="Search diagrams..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button className="wl-search-clear" onClick={() => setSearch('')}>
                    &times;
                  </button>
                )}
              </div>
            </div>

            {/* System Accordion */}
            <div className="wl-systems">
              {filteredSystems.map(sys => (
                <div key={sys.system} className="wl-system">
                  <button
                    className={`wl-system-header ${expandedSystem === sys.system ? 'expanded' : ''}`}
                    onClick={() => {
                      const nextExpanded = expandedSystem === sys.system ? null : sys.system;
                      setExpandedSystem(nextExpanded);
                      trackWiringSystemToggle({
                        vehicle: currentVehicleLabel,
                        system: sys.system,
                        action: nextExpanded ? 'expand' : 'collapse',
                        diagramCount: sys.diagrams.length,
                        scope: 'system_list',
                      });
                    }}
                  >
                    <span className="wl-system-name">{sys.system}</span>
                    <span className="wl-system-count">{sys.diagrams.length}</span>
                    <span className="wl-system-arrow">{expandedSystem === sys.system ? '\u25B2' : '\u25BC'}</span>
                  </button>

                  {expandedSystem === sys.system && (
                    <div className="wl-diagram-list">
                      {sys.diagrams.map((d, idx) => (
                        <button
                          key={idx}
                          className="wl-diagram-item"
                          onClick={() => openDiagram(d, sys.system)}
                        >
                          <svg className="wl-diagram-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <path d="M3 9h18M9 3v18" />
                          </svg>
                          <span className="wl-diagram-name">{d.name}</span>
                          <span className="wl-diagram-view">View &rarr;</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredSystems.length === 0 && (
              <div className="wl-empty">
                No diagrams match &ldquo;{search}&rdquo;. Try a different search term.
              </div>
            )}
          </div>
        )}

        {/* Diagram Viewer Modal */}
        {selectedDiagram && (
          <div
            className="wl-modal-overlay"
            onClick={() => closeDiagram('backdrop')}
            role="presentation"
          >
            <div
              ref={modalRef}
              className="wl-modal"
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={`Wiring diagram: ${selectedDiagram.images.title || selectedDiagram.entry.name}`}
            >
              <div className="wl-modal-header">
                <div>
                  <h3 className="wl-modal-title">{selectedDiagram.images.title || selectedDiagram.entry.name}</h3>
                  <p className="wl-modal-subtitle">
                    {selectedDiagram.images.images.length > 0
                      ? `Image ${selectedImageIndex + 1} of ${selectedDiagram.images.images.length}`
                      : 'Factory service manual image'}
                    {diagramZoom > 1 && ` · Zoom ${Math.round(diagramZoom * 100)}%`}
                    {diagramZoom > 1 && ' · Drag to pan'}
                  </p>
                </div>
                <button
                  ref={closeBtnRef}
                  className="wl-modal-close"
                  onClick={() => closeDiagram('close_button')}
                  aria-label="Close diagram viewer"
                >
                  &times;
                </button>
              </div>
              <div className="wl-modal-body">
                {loadingImage ? (
                  <div className="wl-loading"><div className="wl-spinner" /><p>Loading diagram...</p></div>
                ) : selectedDiagram.images.images.length > 0 ? (
                  <div className="wl-modal-content">
                    <div className="wl-modal-toolbar">
                      <div className="wl-modal-toolbar-group">
                        <button
                          className="wl-modal-btn"
                          onClick={() => updateZoom(diagramZoom - 0.15, 'zoom_out')}
                          title="Zoom out (-)"
                          aria-label="Zoom out"
                        >
                          −
                        </button>
                        <button
                          className="wl-modal-btn"
                          onClick={() => updateZoom(1, 'reset_zoom')}
                          title="Reset zoom"
                          aria-label="Reset zoom"
                        >
                          Reset
                        </button>
                        <button
                          className="wl-modal-btn"
                          onClick={() => updateZoom(diagramZoom + 0.15, 'zoom_in')}
                          title="Zoom in (+)"
                          aria-label="Zoom in"
                        >
                          +
                        </button>
                        <span className="wl-zoom-badge">{Math.round(diagramZoom * 100)}%</span>
                      </div>
                      <div className="wl-modal-toolbar-group">
                        {selectedDiagram.images.images.length > 1 && (
                          <>
                            <button
                              className="wl-modal-btn"
                              onClick={() => {
                                const nextIndex = Math.max(0, selectedImageIndex - 1);
                                setSelectedImageIndex(nextIndex);
                                setPanX(0);
                                setPanY(0);
                                trackWiringDiagramInteract({
                                  vehicle: currentVehicleLabel,
                                  system: expandedSystem || 'diagram-library',
                                  action: 'image_prev',
                                  diagramName: selectedDiagram.entry.name,
                                  interactionTarget: 'image_pager',
                                });
                              }}
                              disabled={selectedImageIndex === 0}
                              title="Previous image (←)"
                              aria-label="Previous image"
                            >
                              Prev
                            </button>
                            <button
                              className="wl-modal-btn"
                              onClick={() => {
                                const nextIndex = Math.min(selectedDiagram.images.images.length - 1, selectedImageIndex + 1);
                                setSelectedImageIndex(nextIndex);
                                setPanX(0);
                                setPanY(0);
                                trackWiringDiagramInteract({
                                  vehicle: currentVehicleLabel,
                                  system: expandedSystem || 'diagram-library',
                                  action: 'image_next',
                                  diagramName: selectedDiagram.entry.name,
                                  interactionTarget: 'image_pager',
                                });
                              }}
                              disabled={selectedImageIndex >= selectedDiagram.images.images.length - 1}
                              title="Next image (→)"
                              aria-label="Next image"
                            >
                              Next
                            </button>
                          </>
                        )}
                        <button className="wl-modal-btn" onClick={handleDownload}>Download</button>
                        <button className="wl-modal-btn" onClick={handleCopyLink}>Copy link</button>
                        <button className="wl-modal-btn" onClick={handleShare}>Share</button>
                      </div>
                    </div>
                    <div
                      ref={imgWrapRef}
                      className={`wl-modal-img-wrap ${isDragging ? 'dragging' : ''} ${diagramZoom > 1 ? 'pannable' : ''}`}
                      onWheel={handleWheel}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      <img
                        src={currentDiagram}
                        alt={`${selectedDiagram.entry.name} - Diagram ${selectedImageIndex + 1}`}
                        className="wl-modal-img"
                        loading="eager"
                        draggable={false}
                        style={{
                          transform: `scale(${diagramZoom}) translate(${panX / diagramZoom}px, ${panY / diagramZoom}px)`,
                          cursor: diagramZoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                        }}
                        onLoad={e => (e.target as HTMLImageElement).classList.add('loaded')}
                      />
                      <img
                        src="/diagram-watermark.svg"
                        alt=""
                        aria-hidden="true"
                        className="wl-modal-watermark wl-modal-watermark-left"
                        draggable={false}
                      />
                      <img
                        src="/diagram-watermark.svg"
                        alt=""
                        aria-hidden="true"
                        className="wl-modal-watermark wl-modal-watermark-right"
                        draggable={false}
                      />
                    </div>

                    {/* Thumbnail strip for multi-image diagrams */}
                    {selectedDiagram.images.images.length > 1 && (
                      <div className="wl-thumbnail-strip">
                        {selectedDiagram.images.images.map((src, idx) => (
                          <button
                            key={idx}
                            className={`wl-thumbnail ${idx === selectedImageIndex ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedImageIndex(idx);
                              setPanX(0);
                              setPanY(0);
                              trackWiringDiagramInteract({
                                vehicle: currentVehicleLabel,
                                system: expandedSystem || 'diagram-library',
                                action: idx > selectedImageIndex ? 'image_next' : 'image_prev',
                                diagramName: selectedDiagram.entry.name,
                                interactionTarget: 'thumbnail_strip',
                              });
                            }}
                            aria-label={`View image ${idx + 1} of ${selectedDiagram.images.images.length}`}
                            aria-current={idx === selectedImageIndex ? 'true' : undefined}
                          >
                            <img
                              src={src}
                              alt=""
                              loading="lazy"
                              draggable={false}
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    {copyStatus && <p className="wl-modal-status">{copyStatus}</p>}
                  </div>
                ) : (
                  <div className="wl-empty">No diagram image found for this page.</div>
                )}
              </div>
              <div className="wl-modal-affiliate">
                <WiringDiagramAffiliateStrip vehicle={currentVehicleLabel} />
              </div>
              <div className="wl-modal-footer">
                <span className="wl-modal-source">Source: Factory Service Manual</span>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .wiring-library {
          max-width: 1200px;
          margin: 0 auto;
          min-height: 100vh;
          color-scheme: dark;
        }

        .wl-header {
          text-align: center;
          padding: 3rem 2rem;
          border-bottom: 1px solid rgba(0, 255, 255, 0.1);
        }

        .wl-header-inner { max-width: 700px; margin: 0 auto; }

        .wl-badge {
          display: inline-block;
          background: rgba(0, 255, 255, 0.1);
          color: #00e5ff;
          font-size: 0.7rem;
          font-weight: 900;
          padding: 0.4rem 1.25rem;
          letter-spacing: 0.2em;
          margin-bottom: 1rem;
          border: 1px solid rgba(0, 255, 255, 0.2);
          border-radius: 4px;
        }

        .wl-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0 0 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: white;
        }

        .wl-subtitle {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
          margin: 0;
        }

        .wl-main { padding: 2rem; }

        /* Vehicle Selector */
        .wl-selector {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
          backdrop-filter: blur(8px);
        }

        .wl-selector-title {
          font-size: 1rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #00e5ff;
          margin: 0 0 1.25rem;
        }

        .wl-dropdowns {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .wl-dropdown-group { display: flex; flex-direction: column; gap: 0.375rem; }

        .wl-hint {
          margin: 1rem 0 0;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.65);
        }

        .wl-hint-warn {
          color: #f6c768;
        }

        .wl-label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255, 255, 255, 0.5);
        }

        .wl-select {
          padding: 0.75rem 1rem;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          font-size: 1rem;
          background: rgba(0, 0, 0, 0.3);
          color: white;
          cursor: pointer;
          transition: border-color 0.2s;
          -webkit-appearance: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2300e5ff' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 2.5rem;
        }

        .wl-select option {
          background: #111;
          color: white;
        }

        .wl-select:focus { border-color: #00e5ff; outline: none; box-shadow: 0 0 0 1px rgba(0, 229, 255, 0.3); }
        .wl-select:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Loading */
        .wl-loading {
          text-align: center;
          padding: 3rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .wl-spinner {
          display: inline-block;
          width: 32px;
          height: 32px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top-color: #00e5ff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 0.75rem;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* Browser */
        .wl-browser {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          overflow: hidden;
        }

        .wl-browser-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid rgba(0, 229, 255, 0.2);
          flex-wrap: wrap;
        }

        .wl-browser-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: white;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .wl-browser-count {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.5);
          margin: 0.25rem 0 0;
        }

        .wl-search-wrap { position: relative; }

        .wl-search {
          padding: 0.625rem 2.5rem 0.625rem 1rem;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          font-size: 0.9rem;
          min-width: 250px;
          background: rgba(0, 0, 0, 0.3);
          color: white;
          transition: border-color 0.2s;
        }

        .wl-search::placeholder { color: rgba(255, 255, 255, 0.35); }
        .wl-search:focus { border-color: #00e5ff; outline: none; box-shadow: 0 0 0 1px rgba(0, 229, 255, 0.3); }

        .wl-search-clear {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          padding: 0 0.25rem;
        }

        /* Systems Accordion */
        .wl-system { border-bottom: 1px solid rgba(255, 255, 255, 0.06); }
        .wl-system:last-child { border-bottom: none; }

        .wl-system-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 1rem 2rem;
          background: none;
          border: none;
          font-size: 1rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
        }

        .wl-system-header:hover { background: rgba(255, 255, 255, 0.04); }
        .wl-system-header.expanded { background: rgba(0, 229, 255, 0.05); }

        .wl-system-name { flex: 1; }

        .wl-system-count {
          background: rgba(0, 229, 255, 0.15);
          color: #00e5ff;
          font-size: 0.7rem;
          font-weight: 900;
          padding: 0.2rem 0.6rem;
          border-radius: 10px;
          min-width: 28px;
          text-align: center;
        }

        .wl-system-arrow {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.3);
        }

        /* Diagram List */
        .wl-diagram-list {
          padding: 0 1rem 1rem 2rem;
        }

        .wl-diagram-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid transparent;
          border-radius: 6px;
          cursor: pointer;
          text-align: left;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.75);
          margin-bottom: 0.375rem;
          transition: all 0.15s;
        }

        .wl-diagram-item:hover {
          background: rgba(0, 229, 255, 0.05);
          border-color: rgba(0, 229, 255, 0.2);
          color: white;
        }

        .wl-diagram-icon { color: #00e5ff; flex-shrink: 0; }
        .wl-diagram-name { flex: 1; }

        .wl-diagram-view {
          font-size: 0.75rem;
          font-weight: 700;
          color: #00e5ff;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0;
          transition: opacity 0.15s;
        }

        .wl-diagram-item:hover .wl-diagram-view { opacity: 1; }

        .wl-empty {
          padding: 2rem;
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
          font-style: italic;
        }

        /* Modal */
        .wl-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.92);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }

        .wl-modal {
          background: #0a0a0a;
          border: none;
          border-radius: 0;
          max-width: 100vw;
          max-height: 100vh;
          width: 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .wl-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          background: rgba(0, 229, 255, 0.08);
          border-bottom: 1px solid rgba(0, 229, 255, 0.15);
        }

        .wl-modal-title {
          font-size: 1rem;
          font-weight: 700;
          margin: 0;
          flex: 1;
          padding-right: 1rem;
          color: white;
        }

        .wl-modal-subtitle {
          margin: 0.25rem 0 0;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.55);
        }

        .wl-modal-close {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          font-size: 1.75rem;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          transition: color 0.15s;
        }

        .wl-modal-close:hover { color: #00e5ff; }

        .wl-modal-body {
          padding: 1rem 1.5rem;
          overflow: hidden;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .wl-modal-content {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          height: 100%;
        }

        .wl-modal-toolbar {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 0.75rem;
        }

        .wl-modal-toolbar-group {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .wl-modal-btn {
          padding: 0.55rem 0.85rem;
          border: 1px solid rgba(0, 229, 255, 0.18);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
        }

        .wl-modal-btn:hover {
          background: rgba(0, 229, 255, 0.08);
          border-color: rgba(0, 229, 255, 0.35);
          color: white;
        }

        .wl-modal-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .wl-modal-img-wrap {
          background: #1a1a1a;
          border-radius: 8px;
          padding: 0.5rem;
          text-align: center;
          position: relative;
          overflow: hidden;
          color: rgba(255, 255, 255, 0.6);
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 0;
        }

        .wl-modal-img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 0 auto;
          transform-origin: center top;
          transition: transform 0.12s ease;
          border-radius: 4px;
        }

        /* White background only when image actually loads — prevents white box on broken images */
        .wl-modal-img.loaded {
          background: white;
        }

        .wl-modal-watermark {
          position: absolute;
          top: 50%;
          height: min(320px, 76%);
          width: auto;
          transform: translateY(-50%);
          opacity: 0.88;
          pointer-events: none;
          filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.18));
        }

        .wl-modal-watermark-left {
          left: 6px;
          right: auto;
        }

        .wl-modal-watermark-right {
          right: 6px;
          left: auto;
        }

        .wl-modal-footer {
          padding: 0.75rem 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          text-align: right;
        }

        .wl-modal-source {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.35);
          font-style: italic;
        }

        .wl-modal-affiliate {
          padding: 0.75rem 1.5rem;
          border-top: 1px solid rgba(0, 229, 255, 0.1);
          background: rgba(0, 229, 255, 0.03);
        }

        .wl-modal-status {
          margin: 0;
          font-size: 0.8rem;
          color: #00e5ff;
          text-align: center;
        }

        .wl-zoom-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.35rem 0.6rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: #00e5ff;
          background: rgba(0, 229, 255, 0.1);
          border: 1px solid rgba(0, 229, 255, 0.2);
          border-radius: 999px;
          min-width: 48px;
          justify-content: center;
        }

        .wl-modal-img-wrap.pannable {
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
        }

        .wl-modal-img-wrap.dragging {
          cursor: grabbing !important;
        }

        .wl-modal-img-wrap.dragging .wl-modal-img {
          transition: none;
        }

        /* Thumbnail strip */
        .wl-thumbnail-strip {
          display: flex;
          gap: 0.5rem;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          overflow-x: auto;
          scrollbar-width: thin;
        }

        .wl-thumbnail-strip::-webkit-scrollbar {
          height: 4px;
        }

        .wl-thumbnail-strip::-webkit-scrollbar-thumb {
          background: rgba(0, 229, 255, 0.3);
          border-radius: 2px;
        }

        .wl-thumbnail {
          flex: 0 0 auto;
          width: 72px;
          height: 52px;
          padding: 2px;
          background: rgba(255, 255, 255, 0.04);
          border: 2px solid transparent;
          border-radius: 6px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          overflow: hidden;
        }

        .wl-thumbnail:hover {
          background: rgba(0, 229, 255, 0.08);
          border-color: rgba(0, 229, 255, 0.3);
        }

        .wl-thumbnail.active {
          background: rgba(0, 229, 255, 0.12);
          border-color: #00e5ff;
        }

        .wl-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 3px;
          opacity: 0.7;
          transition: opacity 0.15s;
        }

        .wl-thumbnail:hover img,
        .wl-thumbnail.active img {
          opacity: 1;
        }

        @media (max-width: 640px) {
          .wl-title { font-size: 1.75rem; }
          .wl-main { padding: 1rem; }
          .wl-selector { padding: 1.25rem; }
          .wl-browser-header { padding: 1rem; }
          .wl-search { min-width: 180px; }
          .wl-system-header { padding: 0.875rem 1rem; }
          .wl-diagram-list { padding: 0 0.5rem 0.5rem 1rem; }
          .wl-modal { width: 100%; max-width: 100vw; border-radius: 0; }
          .wl-modal-header { align-items: flex-start; padding: 0.875rem 1rem; }
          .wl-modal-toolbar { flex-direction: column; gap: 0.5rem; }
          .wl-modal-toolbar-group { width: 100%; }
          .wl-modal-btn { flex: 1 1 auto; justify-content: center; }
          .wl-modal-watermark {
            height: min(220px, 64%);
          }

          .wl-modal-watermark-left {
            left: 3px;
          }

          .wl-modal-watermark-right {
            right: 3px;
          }

          .wl-thumbnail {
            width: 56px;
            height: 42px;
          }

          .wl-zoom-badge {
            padding: 0.3rem 0.5rem;
            font-size: 0.7rem;
          }
        }
      `}</style>
    </div>
  );
}
