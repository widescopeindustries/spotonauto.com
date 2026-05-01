'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { RepairGuide, Vehicle } from '../types';
import { generateToolLinks, generateAllPartsWithLinks } from '../services/affiliateService';
import {
    trackAffiliateClick,
    trackGuideCompletion,
    trackGuideStepExpand,
    trackGuideStepView,
    trackToolClick,
} from '../lib/analytics';
import type { AnalyticsContextInput } from '@/lib/analyticsContext';
import DiagnosticChat from './DiagnosticChat';
import {
    CheckCircle2,
    Circle,
    ChevronRight,
    ChevronDown,
    Image as ImageIcon,
    MessageSquare,
    Wrench,
    AlertTriangle,
    ShoppingCart,
    BookOpen,
    Maximize2,
    X,
    Play,
    Pause,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InteractiveRepairGuideProps {
    guide: RepairGuide;
    vehicle: Vehicle;
    onReset: () => void;
    analyticsContext?: AnalyticsContextInput & {
        task?: string;
    };
}

interface StepState {
    checked: boolean;
    note: string;
    expanded: boolean;
}

function deriveGuideTask(guide: RepairGuide): string {
    const title = guide.title?.trim() || '';
    const vehicle = guide.vehicle?.trim() || '';
    if (!title) return '';
    if (!vehicle) return title;
    const lowerTitle = title.toLowerCase();
    const lowerVehicle = vehicle.toLowerCase();
    if (lowerTitle.startsWith(lowerVehicle)) {
        return title.slice(vehicle.length).replace(/^[\s:,\-–—]+/, '').trim() || title;
    }
    return title;
}

function getStorageKey(guideId: string): string {
    return `spoton-guide-progress-${guideId}`;
}

const InteractiveRepairGuide: React.FC<InteractiveRepairGuideProps> = ({
    guide,
    vehicle,
    onReset,
    analyticsContext,
}) => {
    const guideTask = analyticsContext?.task || deriveGuideTask(guide);
    const steps = guide.steps || [];
    const totalSteps = steps.length;
    const guideId = guide.id || `${vehicle.year}-${vehicle.make}-${vehicle.model}-${guideTask}`;

    const [stepStates, setStepStates] = useState<Record<number, StepState>>({});
    const [activeDiagramIndex, setActiveDiagramIndex] = useState(0);
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
    const [showChat, setShowChat] = useState(true);
    const [progressPulse, setProgressPulse] = useState(false);
    const [mobilePanel, setMobilePanel] = useState<'diagram' | 'checklist' | 'chat'>('checklist');
    const viewedStepsRef = useRef<Set<number>>(new Set());
    const completionFiredRef = useRef(false);

    const guideAnalyticsContext: AnalyticsContextInput = {
        pageSurface: analyticsContext?.pageSurface || 'repair_guide',
        intentCluster: analyticsContext?.intentCluster,
        task: guideTask,
        taskSlug: analyticsContext?.taskSlug,
        vehicleYear: analyticsContext?.vehicleYear,
        vehicleMake: analyticsContext?.vehicleMake,
        vehicleModel: analyticsContext?.vehicleModel,
    };

    const partsWithLinks = generateAllPartsWithLinks(guide.parts || [], guide.vehicle);

    // Collect all images from steps
    const diagramImages = steps
        .map((step, idx) => ({
            url: step.imageUrl,
            stepNumber: step.step,
            caption: `Step ${step.step} — ${step.instruction.slice(0, 60)}...`,
        }))
        .filter((img) => img.url);

    // Load saved progress
    useEffect(() => {
        try {
            const saved = localStorage.getItem(getStorageKey(guideId));
            if (saved) {
                setStepStates(JSON.parse(saved));
            }
        } catch {
            // ignore
        }
        viewedStepsRef.current = new Set();
        completionFiredRef.current = false;
    }, [guideId]);

    // Save progress
    useEffect(() => {
        try {
            localStorage.setItem(getStorageKey(guideId), JSON.stringify(stepStates));
        } catch {
            // ignore
        }
    }, [stepStates, guideId]);

    const checkedCount = Object.values(stepStates).filter((s) => s.checked).length;
    const progressPercent = totalSteps > 0 ? Math.round((checkedCount / totalSteps) * 100) : 0;

    useEffect(() => {
        if (progressPercent === 100 && totalSteps > 0 && !completionFiredRef.current) {
            completionFiredRef.current = true;
            trackGuideCompletion({
                vehicle: guide.vehicle,
                task: guideTask,
                totalSteps,
                viewedSteps: checkedCount,
                reason: 'manual_complete',
                ...guideAnalyticsContext,
            });
        }
    }, [progressPercent, totalSteps, guide.vehicle, guideTask, checkedCount, guideAnalyticsContext]);

    const toggleStep = useCallback((stepNumber: number) => {
        setStepStates((prev) => {
            const current = prev[stepNumber] || { checked: false, note: '', expanded: false };
            const next = { ...current, checked: !current.checked };
            return { ...prev, [stepNumber]: next };
        });
        setProgressPulse(true);
        setTimeout(() => setProgressPulse(false), 600);
    }, []);

    const expandStep = useCallback((stepNumber: number) => {
        setStepStates((prev) => {
            const current = prev[stepNumber] || { checked: false, note: '', expanded: false };
            const next = { ...current, expanded: !current.expanded };
            return { ...prev, [stepNumber]: next };
        });

        const step = steps.find((s) => s.step === stepNumber);
        if (!viewedStepsRef.current.has(stepNumber)) {
            viewedStepsRef.current.add(stepNumber);
            trackGuideStepView({
                vehicle: guide.vehicle,
                task: guideTask,
                step: stepNumber,
                stepLabel: step?.instruction,
                totalSteps,
                ...guideAnalyticsContext,
            });
        }
        trackGuideStepExpand({
            vehicle: guide.vehicle,
            task: guideTask,
            step: stepNumber,
            stepLabel: step?.instruction,
            totalSteps,
            ...guideAnalyticsContext,
        });
    }, [steps, guide.vehicle, guideTask, totalSteps, guideAnalyticsContext]);

    const updateNote = useCallback((stepNumber: number, note: string) => {
        setStepStates((prev) => {
            const current = prev[stepNumber] || { checked: false, note: '', expanded: false };
            return { ...prev, [stepNumber]: { ...current, note } };
        });
    }, []);

    // ─── Panels ───────────────────────────────────────────────────────────────

    const DiagramPanel = () => (
        <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b border-white/10 bg-black/40 p-3">
                <ImageIcon className="h-4 w-4 text-neon-cyan" />
                <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-neon-cyan">
                    OEM Diagrams
                </h3>
                <span className="ml-auto rounded-full bg-neon-cyan/10 px-2 py-0.5 text-[10px] text-neon-cyan">
                    {diagramImages.length}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neon-cyan/20">
                {diagramImages.length > 0 ? (
                    <div className="space-y-3">
                        {/* Main viewer */}
                        <div className="relative overflow-hidden rounded-lg border border-white/10 bg-black/60">
                            <img
                                src={diagramImages[activeDiagramIndex]?.url}
                                alt={`Diagram ${activeDiagramIndex + 1}`}
                                className="h-48 w-full object-contain"
                            />
                            <button
                                onClick={() => setFullscreenImage(diagramImages[activeDiagramIndex]?.url || null)}
                                className="absolute right-2 top-2 rounded bg-black/60 p-1.5 text-white hover:bg-black/80"
                            >
                                <Maximize2 className="h-3.5 w-3.5" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-3 py-1.5 text-[10px] text-gray-300">
                                {diagramImages[activeDiagramIndex]?.caption}
                            </div>
                        </div>

                        {/* Thumbnail strip */}
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {diagramImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveDiagramIndex(idx)}
                                    className={`relative flex-shrink-0 overflow-hidden rounded border-2 transition-all ${
                                        idx === activeDiagramIndex
                                            ? 'border-neon-cyan'
                                            : 'border-transparent opacity-60 hover:opacity-100'
                                    }`}
                                >
                                    <img
                                        src={img.url}
                                        alt={`Thumb ${idx + 1}`}
                                        className="h-16 w-20 object-cover"
                                    />
                                    <span className="absolute bottom-0.5 left-0.5 rounded bg-black/70 px-1 text-[9px] text-white">
                                        {img.stepNumber}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-black/30 p-6 text-center">
                        <ImageIcon className="mb-2 h-8 w-8 text-gray-600" />
                        <p className="text-xs text-gray-500">No diagrams available for this guide.</p>
                        <p className="mt-1 text-[10px] text-gray-600">AI-generated images may appear below the steps.</p>
                    </div>
                )}

                {/* Manual sources */}
                {guide.sources && guide.sources.length > 0 && (
                    <div className="mt-4">
                        <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                            Factory Manual Sources
                        </h4>
                        <div className="space-y-2">
                            {guide.sources.slice(0, 3).map((source, idx) => (
                                <a
                                    key={idx}
                                    href={source.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block rounded border border-white/5 bg-black/30 p-2 text-xs text-cyan-300 transition-colors hover:border-cyan-500/30 hover:bg-black/50"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <BookOpen className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate">{source.title}</span>
                                    </div>
                                    {source.snippet && (
                                        <p className="mt-1 line-clamp-2 text-[10px] text-gray-500">
                                            {source.snippet}
                                        </p>
                                    )}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const ChecklistPanel = () => (
        <div className="flex h-full flex-col">
            {/* Header with progress */}
            <div className="border-b border-white/10 bg-black/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-neon-cyan" />
                        <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-white">
                            Repair Checklist
                        </h2>
                    </div>
                    <span className="rounded-full bg-neon-cyan/10 px-2.5 py-1 text-xs font-bold text-neon-cyan">
                        {checkedCount}/{totalSteps}
                    </span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-white/5">
                    <motion.div
                        className={`absolute inset-y-0 left-0 rounded-full bg-neon-cyan ${progressPulse ? 'brightness-125' : ''}`}
                        initial={false}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                </div>
                <p className="mt-1.5 text-[10px] text-gray-500">
                    {progressPercent === 100
                        ? '✓ All steps completed — great job!'
                        : `${progressPercent}% complete — ${totalSteps - checkedCount} steps remaining`}
                </p>
            </div>

            {/* Steps */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neon-cyan/20">
                <div className="space-y-3">
                    {steps.map((step, idx) => {
                        const state = stepStates[step.step] || { checked: false, note: '', expanded: false };
                        return (
                            <motion.div
                                key={step.step}
                                layout
                                initial={false}
                                animate={{
                                    borderColor: state.checked ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.05)',
                                    backgroundColor: state.checked ? 'rgba(6,182,212,0.04)' : 'rgba(0,0,0,0.3)',
                                }}
                                className="rounded-lg border p-3 transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    <button
                                        onClick={() => toggleStep(step.step)}
                                        className="mt-0.5 flex-shrink-0"
                                    >
                                        {state.checked ? (
                                            <CheckCircle2 className="h-5 w-5 text-neon-cyan" />
                                        ) : (
                                            <Circle className="h-5 w-5 text-gray-600" />
                                        )}
                                    </button>
                                    <div className="min-w-0 flex-1">
                                        <button
                                            onClick={() => expandStep(step.step)}
                                            className="flex w-full items-start justify-between text-left"
                                        >
                                            <div className="flex-1">
                                                <span className="mr-2 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-white/5 text-[10px] font-bold text-gray-400">
                                                    {step.step}
                                                </span>
                                                <span
                                                    className={`text-sm leading-relaxed ${
                                                        state.checked ? 'text-gray-500 line-through' : 'text-gray-200'
                                                    }`}
                                                >
                                                    {step.instruction}
                                                </span>
                                            </div>
                                            <ChevronDown
                                                className={`ml-2 h-4 w-4 flex-shrink-0 text-gray-600 transition-transform ${
                                                    state.expanded ? 'rotate-180' : ''
                                                }`}
                                            />
                                        </button>

                                        <AnimatePresence>
                                            {state.expanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="mt-3 space-y-3 border-t border-white/5 pt-3">
                                                        {/* Step image if available */}
                                                        {step.imageUrl && (
                                                            <div className="relative overflow-hidden rounded-lg border border-white/10">
                                                                <img
                                                                    src={step.imageUrl}
                                                                    alt={`Step ${step.step}`}
                                                                    className="w-full object-contain"
                                                                    loading="lazy"
                                                                />
                                                                {step.imageUrl && (
                                                                    <button
                                                                        onClick={() => setFullscreenImage(step.imageUrl || null)}
                                                                        className="absolute right-2 top-2 rounded bg-black/60 p-1 text-white hover:bg-black/80"
                                                                    >
                                                                        <Maximize2 className="h-3 w-3" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Personal notes */}
                                                        <div>
                                                            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                                                                Your Notes
                                                            </label>
                                                            <textarea
                                                                value={state.note}
                                                                onChange={(e) => updateNote(step.step, e.target.value)}
                                                                placeholder="Torque values, part numbers, observations..."
                                                                className="w-full rounded border border-white/10 bg-black/40 p-2 text-xs text-white placeholder-gray-600 focus:border-neon-cyan/50 focus:outline-none"
                                                                rows={2}
                                                            />
                                                        </div>

                                                        {/* Navigation between steps */}
                                                        <div className="flex justify-between">
                                                            {idx > 0 && (
                                                                <button
                                                                    onClick={() => {
                                                                        const prevStep = steps[idx - 1].step;
                                                                        setStepStates((prev) => ({
                                                                            ...prev,
                                                                            [prevStep]: { ...(prev[prevStep] || { checked: false, note: '', expanded: false }), expanded: true },
                                                                        }));
                                                                    }}
                                                                    className="text-[10px] text-cyan-400 hover:text-cyan-300"
                                                                >
                                                                    ← Previous step
                                                                </button>
                                                            )}
                                                            {idx < steps.length - 1 && (
                                                                <button
                                                                    onClick={() => {
                                                                        const nextStep = steps[idx + 1].step;
                                                                        setStepStates((prev) => ({
                                                                            ...prev,
                                                                            [nextStep]: { ...(prev[nextStep] || { checked: false, note: '', expanded: false }), expanded: true },
                                                                        }));
                                                                    }}
                                                                    className="ml-auto text-[10px] text-cyan-400 hover:text-cyan-300"
                                                                >
                                                                    Next step →
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Parts & Tools sections */}
                <div className="mt-6 space-y-4">
                    {guide.safetyWarnings && guide.safetyWarnings.length > 0 && (
                        <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-4">
                            <div className="mb-2 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-400" />
                                <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-200">
                                    Safety Warnings
                                </h3>
                            </div>
                            <ul className="space-y-1.5">
                                {guide.safetyWarnings.map((warning, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-xs text-amber-100/80">
                                        <span className="mt-0.5 text-amber-400">▸</span>
                                        {warning}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {partsWithLinks.length > 0 && (
                        <div className="rounded-lg border border-white/5 bg-black/30 p-4">
                            <div className="mb-3 flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4 text-emerald-400" />
                                <h3 className="text-xs font-semibold uppercase tracking-widest text-emerald-200">
                                    Parts Required
                                </h3>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {partsWithLinks.map((part, idx) => (
                                    <div
                                        key={idx}
                                        className={`rounded border p-2.5 ${
                                            part.isHighTicket
                                                ? 'border-amber-500/20 bg-amber-500/[0.04]'
                                                : 'border-white/5 bg-black/20'
                                        }`}
                                    >
                                        <div className="text-xs font-medium text-gray-200">{part.name}</div>
                                        {part.links[0] && (
                                            <a
                                                href={part.links[0].url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() =>
                                                    trackAffiliateClick(
                                                        {
                                                            provider: 'Amazon',
                                                            partName: part.name,
                                                            vehicle: guide.vehicle,
                                                            isHighTicket: part.isHighTicket,
                                                            pageType: 'repair_guide',
                                                        },
                                                        guideAnalyticsContext
                                                    )
                                                }
                                                className="mt-1.5 inline-flex items-center gap-1 rounded bg-[#FFD814] px-2 py-1 text-[10px] font-bold text-black hover:bg-[#F7CA00]"
                                            >
                                                Shop Amazon
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {guide.tools && guide.tools.length > 0 && (
                        <div className="rounded-lg border border-white/5 bg-black/30 p-4">
                            <div className="mb-3 flex items-center gap-2">
                                <Wrench className="h-4 w-4 text-cyan-400" />
                                <h3 className="text-xs font-semibold uppercase tracking-widest text-cyan-200">
                                    Tools Needed
                                </h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {guide.tools.map((tool, idx) => {
                                    const links = generateToolLinks(tool);
                                    return (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-2 rounded border border-white/5 bg-black/40 px-2.5 py-1.5 text-xs text-gray-300"
                                        >
                                            <span className="text-emerald-400">✓</span>
                                            {tool}
                                            {links[0] && (
                                                <a
                                                    href={links[0].url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={() => trackToolClick(tool, guide.vehicle, guideAnalyticsContext)}
                                                    className="ml-1 text-[10px] text-cyan-400 underline hover:text-cyan-300"
                                                >
                                                    Buy
                                                </a>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const ChatPanel = () => (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-white/10 bg-black/40 p-3">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-neon-cyan" />
                    <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-neon-cyan">
                        AI Assistant
                    </h3>
                </div>
                <button
                    onClick={() => setShowChat((s) => !s)}
                    className="rounded p-1 text-gray-500 hover:text-white"
                >
                    {showChat ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
            </div>
            <div className="flex-1 overflow-hidden">
                {showChat && (
                    <DiagnosticChat
                        vehicle={vehicle}
                        initialProblem={`I'm working on ${guideTask} for my ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        className="h-full max-w-none rounded-none border-0 shadow-none"
                    />
                )}
            </div>
        </div>
    );

    return (
        <div className="flex min-h-[70vh] flex-col overflow-hidden bg-[#0a0a0a] md:h-[calc(100vh-80px)]">
            {/* Mobile tabs */}
            <div className="flex border-b border-white/10 bg-black/60 md:hidden">
                {([
                    { key: 'diagram', label: 'Diagrams', icon: ImageIcon },
                    { key: 'checklist', label: 'Checklist', icon: CheckCircle2 },
                    { key: 'chat', label: 'AI Help', icon: MessageSquare },
                ] as const).map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setMobilePanel(tab.key)}
                        className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
                            mobilePanel === tab.key
                                ? 'border-b-2 border-neon-cyan text-neon-cyan'
                                : 'text-gray-500'
                        }`}
                    >
                        <tab.icon className="h-3.5 w-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Desktop 3-panel layout / Mobile single panel */}
            <div className="flex flex-1 overflow-hidden">
                {/* Diagram Panel */}
                <div
                    className={`${
                        mobilePanel === 'diagram' ? 'flex' : 'hidden'
                    } w-full flex-col border-r border-white/10 md:flex md:w-[280px] lg:w-[320px]`}
                >
                    <DiagramPanel />
                </div>

                {/* Checklist Panel */}
                <div
                    className={`${
                        mobilePanel === 'checklist' ? 'flex' : 'hidden'
                    } w-full flex-1 flex-col md:flex`}
                >
                    <ChecklistPanel />
                </div>

                {/* Chat Panel */}
                <div
                    className={`${
                        mobilePanel === 'chat' ? 'flex' : 'hidden'
                    } w-full flex-col border-l border-white/10 md:flex md:w-[340px] lg:w-[380px]`}
                >
                    <ChatPanel />
                </div>
            </div>

            {/* Fullscreen image modal */}
            <AnimatePresence>
                {fullscreenImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                        onClick={() => setFullscreenImage(null)}
                    >
                        <button
                            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                            onClick={() => setFullscreenImage(null)}
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <img
                            src={fullscreenImage}
                            alt="Fullscreen diagram"
                            className="max-h-[90vh] max-w-full rounded-lg object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InteractiveRepairGuide;
