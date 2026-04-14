'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { RepairGuide } from '../types';
import { generateToolLinks, generateAllPartsWithLinks } from '../services/affiliateService';
import {
    trackAffiliateClick,
    trackGuideCompletion,
    trackGuideStepExpand,
    trackGuideStepView,
    trackToolClick,
} from '../lib/analytics';
import type { AnalyticsContextInput } from '@/lib/analyticsContext';

interface ServiceManualGuideProps {
    guide: RepairGuide;
    onReset: () => void;
    analyticsContext?: AnalyticsContextInput & {
        task?: string;
    };
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

const ServiceManualGuide: React.FC<ServiceManualGuideProps> = ({ guide, onReset, analyticsContext }) => {
    const [activeStep, setActiveStep] = useState<number | null>(null);
    const stepRefs = useRef(new Map<number, HTMLDivElement>());
    const viewedStepsRef = useRef<Set<number>>(new Set());
    const completionFiredRef = useRef(false);
    const guideTask = analyticsContext?.task || deriveGuideTask(guide);
    const steps = guide.steps || [];
    const totalSteps = steps.length;
    const lastStepNumber = steps.length ? steps[steps.length - 1].step : null;
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

    useEffect(() => {
        viewedStepsRef.current = new Set();
        completionFiredRef.current = false;
        setActiveStep(null);
    }, [guide.id, guide.vehicle, guide.title, totalSteps]);

    useEffect(() => {
        if (!totalSteps) return undefined;

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting || entry.intersectionRatio < 0.55) continue;

                    const stepNumber = Number((entry.target as HTMLElement).dataset.stepNumber);
                    if (!Number.isFinite(stepNumber) || viewedStepsRef.current.has(stepNumber)) continue;

                    viewedStepsRef.current.add(stepNumber);
                    const step = steps.find((item) => item.step === stepNumber);
                    trackGuideStepView({
                        vehicle: guide.vehicle,
                        task: guideTask,
                        step: stepNumber,
                        stepLabel: step?.instruction,
                        totalSteps,
                        ...guideAnalyticsContext,
                    });

                    if (
                        !completionFiredRef.current &&
                        (stepNumber === lastStepNumber || viewedStepsRef.current.size === totalSteps)
                    ) {
                        completionFiredRef.current = true;
                        trackGuideCompletion({
                            vehicle: guide.vehicle,
                            task: guideTask,
                            totalSteps,
                            viewedSteps: viewedStepsRef.current.size,
                            reason: stepNumber === lastStepNumber ? 'last_step_viewed' : 'all_steps_viewed',
                            ...guideAnalyticsContext,
                        });
                    }
                }
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -15% 0px',
            },
        );

        stepRefs.current.forEach((node) => observer.observe(node));

        return () => observer.disconnect();
    }, [guide.id, guide.title, guide.vehicle, guideTask, lastStepNumber, totalSteps]);

    function handleStepToggle(stepNumber: number): void {
        const nextActiveStep = activeStep === stepNumber ? null : stepNumber;

        if (nextActiveStep === stepNumber) {
            const step = steps.find((item) => item.step === stepNumber);
            trackGuideStepExpand({
                vehicle: guide.vehicle,
                task: guideTask,
                step: stepNumber,
                stepLabel: step?.instruction,
                totalSteps,
                ...guideAnalyticsContext,
            });
        }

        setActiveStep(nextActiveStep);
    }

    function setStepRef(stepNumber: number) {
        return (node: HTMLDivElement | null) => {
            if (node) {
                stepRefs.current.set(stepNumber, node);
            } else {
                stepRefs.current.delete(stepNumber);
            }
        };
    }

    return (
            <div className="service-manual">
            <header className="manual-header">
                <div className="manual-header-inner">
                    <div className="manual-badge">SERVICE MANUAL</div>
                    <h1 className="manual-title">
                        {guide.title}
                    </h1>
                    <div className="manual-vehicle">{guide.vehicle}</div>
                    <div className="manual-meta">
                        <span className="manual-meta-item">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Est. 45-90 min
                        </span>
                        <span className="manual-meta-item">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Intermediate
                        </span>
                        <span className="manual-meta-item">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            {guide.steps?.length || 0} Steps
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Content Area - Book-like layout */}
            <main className="manual-content">

                {/* Table of Contents Sidebar */}
                <aside className="manual-toc">
                    <h3 className="toc-title">Contents</h3>
                    <nav className="toc-nav">
                        <a href="#safety" className="toc-link">⚠️ Safety Warnings</a>
                        <a href="#parts" className="toc-link">🔧 Parts Required</a>
                        <a href="#tools" className="toc-link">🛠️ Tools Needed</a>
                        <a href="#procedure" className="toc-link">📋 Procedure</a>
                        {guide.steps?.map((step) => (
                            <a
                                key={step.step}
                                href={`#step-${step.step}`}
                                className={`toc-link toc-step ${activeStep === step.step ? 'active' : ''}`}
                            >
                                Step {step.step}
                            </a>
                        ))}
                        <a href="#sources" className="toc-link">📚 Sources</a>
                    </nav>
                    <button onClick={onReset} className="toc-new-search">
                        ← New Search
                    </button>
                </aside>

                {/* Main Manual Pages */}
                <div className="manual-pages">

                    {/* Page: Safety Warnings */}
                    {guide.safetyWarnings && guide.safetyWarnings.length > 0 && (
                        <section id="safety" className="manual-page">
                            <div className="page-header warning">
                                <span className="page-icon">⚠️</span>
                                <h2 className="page-title">Safety Warnings</h2>
                            </div>
                            <div className="warning-box">
                                <div className="warning-header">
                                    <strong>CAUTION:</strong> Read all warnings before proceeding
                                </div>
                                <ul className="warning-list">
                                    {guide.safetyWarnings.map((warning, idx) => (
                                        <li key={idx} className="warning-item">
                                            <span className="warning-bullet">▸</span>
                                            {warning}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>
                    )}

                    {/* Page: Parts Required */}
                    {partsWithLinks.length > 0 && (
                        <section
                            id="parts"
                            className="manual-page"
                        >
                            <div className="page-header">
                                <span className="page-icon">🔧</span>
                                <h2 className="page-title">Parts Required</h2>
                            </div>
                            <div className="parts-savings-banner">
                                Save 30&ndash;50% vs. mechanic markup &mdash; buy parts direct
                            </div>
                            <div className="parts-grid">
                                {partsWithLinks.map((part, idx) => (
                                    <div key={idx} className={`part-card ${part.isHighTicket ? 'part-card-featured' : ''}`}>
                                        {part.isHighTicket && (
                                            <div className="part-featured-badge">Major Component</div>
                                        )}
                                        <div className="part-card-name">{part.name}</div>
                                        {part.links.map((link, linkIdx) => (
                                            <a
                                                key={linkIdx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => trackAffiliateClick({
                                                    provider: 'Amazon',
                                                    partName: part.name,
                                                    vehicle: guide.vehicle,
                                                    isHighTicket: part.isHighTicket,
                                                    pageType: 'repair_guide',
                                                }, guideAnalyticsContext)}
                                                className="part-amazon-btn"
                                            >
                                                <svg className="amazon-logo" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                                    <path d="M.045 18.02c.072-.116.187-.124.348-.022 3.012 1.935 6.338 2.907 9.971 2.907 2.888 0 5.61-.677 8.038-2.032.264-.143.4-.133.4.033 0 .2-.158.38-.474.558-2.397 1.373-5.164 2.064-8.007 2.064-3.57 0-6.754-1.002-9.55-3.006-.246-.167-.336-.299-.272-.39l.546-.112zM23.98 16.168c-.11-.163-.587-.195-1.345-.095-.758.1-1.69.32-1.69.32-.168.038-.2-.073-.04-.258.82-.598 1.152-.68 2.066-.784.914-.105 2.41.13 2.69.608.28.478-.302 3.015-1.13 4.33-.136.216-.28.152-.216-.06.408-.99.736-3.203.665-4.06z"/>
                                                </svg>
                                                Shop on Amazon
                                                <span className="prime-badge">Prime</span>
                                            </a>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Page: Tools Needed */}
                    {guide.tools && guide.tools.length > 0 && (
                        <section id="tools" className="manual-page">
                            <div className="page-header">
                                <span className="page-icon">🛠️</span>
                                <h2 className="page-title">Tools Needed</h2>
                            </div>
                            <div className="tools-grid">
                                {guide.tools.map((tool, idx) => {
                                    const links = generateToolLinks(tool);
                                    return (
                                        <div key={idx} className="tool-item">
                                            <span className="tool-check">✓</span>
                                            <span className="tool-name">{tool}</span>
                                            {links[0] && (
                                                <a
                                                    href={links[0].url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={() => trackToolClick(tool, guide.vehicle, guideAnalyticsContext)}
                                                    className="tool-buy"
                                                >
                                                    Buy
                                                </a>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Page: Procedure Steps */}
                    <section id="procedure" className="manual-page procedure-section">
                        <div className="page-header">
                            <span className="page-icon">📋</span>
                            <h2 className="page-title">Repair Procedure</h2>
                        </div>

                        <div className="steps-container">
                            {steps.map((step, idx) => (
                                <div
                                    key={step.step}
                                    id={`step-${step.step}`}
                                    ref={setStepRef(step.step)}
                                    data-step-number={step.step}
                                    className={`step-card ${activeStep === step.step ? 'active' : ''}`}
                                    onClick={() => handleStepToggle(step.step)}
                                >
                                    <div className="step-header">
                                        <div className="step-number">
                                            {step.step}
                                        </div>
                                        <div className="step-instruction">
                                            {step.instruction}
                                        </div>
                                    </div>

                                    {step.imageUrl && (
                                        <div className="step-image-container">
                                            <div className="step-image-frame">
                                                <img
                                                    src={step.imageUrl}
                                                    alt={`Diagram for step ${step.step}`}
                                                    className="step-image"
                                                    loading="lazy"
                                                />
                                                <span className="step-image-watermark step-image-watermark-left" aria-hidden="true">
                                                    SpotOnAuto.com
                                                </span>
                                                <span className="step-image-watermark step-image-watermark-right" aria-hidden="true">
                                                    SpotOnAuto.com
                                                </span>
                                            </div>
                                            <p className="image-caption">Fig. {step.step} — Reference diagram</p>
                                        </div>
                                    )}


                                    {idx < totalSteps - 1 && (
                                        <div className="step-connector">
                                            <div
                                                className="connector-line"
                                                style={{ 
                                                    width: '2px', 
                                                    background: '#d0ccc4', 
                                                    margin: '0 auto', 
                                                    transformOrigin: 'top' 
                                                }}
                                            />
                                            <div className="connector-arrow">
                                                ↓
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Page: Sources */}
                    {guide.sources && guide.sources.length > 0 && (
                        <section id="sources" className="manual-page">
                            <div className="page-header">
                                <span className="page-icon">📚</span>
                                <h2 className="page-title">Reference Sources</h2>
                            </div>
                            <div className="sources-list">
                                <p className="sources-intro">
                                    This guide was compiled from the following verified sources:
                                </p>
                                <ul className="sources-items">
                                    {guide.sources.map((source, idx) => (
                                        <li key={idx} className="source-item">
                                            <span className="source-number">[{idx + 1}]</span>
                                            <div className="flex flex-col gap-1">
                                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="source-link">
                                                    {source.title}
                                                    {typeof source.similarity === 'number' && (
                                                        <span className="ml-2 text-xs text-emerald-600">
                                                            {(source.similarity * 100).toFixed(0)}% match
                                                        </span>
                                                    )}
                                                </a>
                                                {source.snippet && (
                                                    <p className="text-sm text-[#5d5a54] leading-relaxed">
                                                        {source.snippet}
                                                    </p>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>
                    )}

                </div>
            </main>

            {/* Inline Styles for Service Manual Look */}
            <style jsx>{`
                .service-manual {
                    max-width: 1200px;
                    margin: 0 auto;
                    font-family: 'Georgia', 'Times New Roman', serif;
                    background: #f8f6f1;
                    color: #1a1a1a;
                    min-height: 100vh;
                    box-shadow: 0 0 60px rgba(0,0,0,0.3);
                }

                /* Header - Book Cover Style */
                .manual-header {
                    background: linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%);
                    color: white;
                    padding: 3rem 2rem;
                    border-bottom: 4px solid #ffd700;
                }

                .manual-header-inner {
                    max-width: 800px;
                    margin: 0 auto;
                    text-align: center;
                }

                .manual-badge {
                    display: inline-block;
                    background: #ffd700;
                    color: #0d1b2a;
                    font-family: 'Arial Black', sans-serif;
                    font-size: 0.75rem;
                    font-weight: 900;
                    padding: 0.5rem 1.5rem;
                    letter-spacing: 0.2em;
                    margin-bottom: 1.5rem;
                }

                .manual-title {
                    font-size: 2.5rem;
                    font-weight: 700;
                    margin-bottom: 0.5rem;
                    line-height: 1.2;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .manual-vehicle {
                    font-size: 1.25rem;
                    opacity: 0.9;
                    margin-bottom: 1.5rem;
                    font-style: italic;
                }

                .manual-meta {
                    display: flex;
                    justify-content: center;
                    gap: 2rem;
                    flex-wrap: wrap;
                }

                .manual-meta-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.875rem;
                    opacity: 0.85;
                }

                /* Main Content Layout */
                .manual-content {
                    display: grid;
                    grid-template-columns: 220px 1fr;
                    min-height: calc(100vh - 200px);
                }

                @media (max-width: 768px) {
                    .manual-content {
                        grid-template-columns: 1fr;
                    }
                    .manual-toc {
                        display: none;
                    }
                }

                /* Table of Contents */
                .manual-toc {
                    background: #e8e4dc;
                    padding: 1.5rem;
                    border-right: 1px solid #d0ccc4;
                    position: sticky;
                    top: 0;
                    height: 100vh;
                    overflow-y: auto;
                }

                .toc-title {
                    font-family: 'Arial Black', sans-serif;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    color: #666;
                    margin-bottom: 1rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 2px solid #1e3a5f;
                }

                .toc-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .toc-link {
                    color: #1e3a5f;
                    text-decoration: none;
                    font-size: 0.875rem;
                    padding: 0.5rem 0.75rem;
                    border-radius: 4px;
                    transition: all 0.2s;
                }

                .toc-link:hover {
                    background: #d0ccc4;
                }

                .toc-link.active {
                    background: #1e3a5f;
                    color: white;
                }

                .toc-step {
                    padding-left: 1.5rem;
                    font-size: 0.8rem;
                }

                .toc-new-search {
                    margin-top: 2rem;
                    width: 100%;
                    padding: 0.75rem;
                    background: #1e3a5f;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: background 0.2s;
                }

                .toc-new-search:hover {
                    background: #2d4a6f;
                }

                /* Manual Pages */
                .manual-pages {
                    padding: 2rem 3rem;
                    background: #f8f6f1;
                }

                .manual-page {
                    margin-bottom: 3rem;
                    padding-bottom: 2rem;
                    border-bottom: 1px solid #d0ccc4;
                }

                .page-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1.5rem;
                    padding-bottom: 0.75rem;
                    border-bottom: 2px solid #1e3a5f;
                }

                .page-header.warning {
                    border-bottom-color: #dc2626;
                }

                .page-icon {
                    font-size: 1.5rem;
                }

                .page-title {
                    font-family: 'Arial Black', sans-serif;
                    font-size: 1.25rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #1e3a5f;
                    margin: 0;
                }

                /* Warning Box */
                .warning-box {
                    background: #fef3c7;
                    border: 2px solid #f59e0b;
                    border-radius: 8px;
                    overflow: hidden;
                }

                .warning-header {
                    background: #dc2626;
                    color: white;
                    padding: 0.75rem 1rem;
                    font-weight: 700;
                }

                .warning-list {
                    list-style: none;
                    padding: 1rem 1.5rem;
                    margin: 0;
                }

                .warning-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.75rem;
                    padding: 0.5rem 0;
                    color: #7c2d12;
                    line-height: 1.5;
                }

                .warning-bullet {
                    color: #dc2626;
                    font-weight: bold;
                }

                /* Parts Section */
                .parts-savings-banner {
                    background: linear-gradient(135deg, #059669 0%, #047857 100%);
                    color: white;
                    padding: 0.75rem 1.25rem;
                    border-radius: 8px;
                    font-family: 'Arial', sans-serif;
                    font-weight: 700;
                    font-size: 0.875rem;
                    text-align: center;
                    margin-bottom: 1.25rem;
                }

                .parts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
                    gap: 1rem;
                }

                .part-card {
                    background: white;
                    border: 1px solid #d0ccc4;
                    border-radius: 12px;
                    padding: 1.25rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    transition: all 0.2s;
                    position: relative;
                }

                .part-card:hover {
                    border-color: #ff9900;
                    box-shadow: 0 4px 12px rgba(255,153,0,0.15);
                }

                .part-card-featured {
                    border-color: #ff9900;
                    border-width: 2px;
                }

                .part-featured-badge {
                    position: absolute;
                    top: -10px;
                    right: 12px;
                    background: linear-gradient(135deg, #ff9900, #e88b00);
                    color: #111;
                    font-family: 'Arial Black', sans-serif;
                    font-size: 0.625rem;
                    font-weight: 900;
                    padding: 0.25rem 0.75rem;
                    border-radius: 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .part-card-name {
                    font-weight: 600;
                    font-size: 1.05rem;
                    color: #1a1a1a;
                }

                .part-amazon-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1rem;
                    background: linear-gradient(180deg, #FFD814 0%, #FF9900 100%);
                    color: #111;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 0.875rem;
                    text-decoration: none;
                    transition: all 0.2s;
                    border: 1px solid #e88b00;
                }

                .part-amazon-btn:hover {
                    background: linear-gradient(180deg, #F7CA00 0%, #E88B00 100%);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(255,153,0,0.3);
                }

                .amazon-logo {
                    width: 16px;
                    height: 16px;
                }

                .prime-badge {
                    background: #232f3e;
                    color: #00a8e1;
                    font-size: 0.625rem;
                    font-weight: 800;
                    padding: 0.125rem 0.5rem;
                    border-radius: 3px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                /* Tools Grid */
                .tools-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 0.75rem;
                }

                .tool-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.875rem 1rem;
                    background: white;
                    border: 1px solid #d0ccc4;
                    border-radius: 6px;
                }

                .tool-check {
                    color: #059669;
                    font-weight: bold;
                    font-size: 1.25rem;
                }

                .tool-name {
                    flex: 1;
                    font-weight: 500;
                }

                .tool-buy {
                    padding: 0.25rem 0.75rem;
                    background: #f8f6f1;
                    border: 1px solid #d0ccc4;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #1e3a5f;
                    text-decoration: none;
                    transition: all 0.2s;
                }

                .tool-buy:hover {
                    background: #1e3a5f;
                    color: white;
                }

                /* Steps */
                .steps-container {
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                }

                .step-card {
                    background: white;
                    border: 1px solid #d0ccc4;
                    border-radius: 8px;
                    padding: 1.5rem;
                    margin-bottom: 1rem;
                    transition: all 0.2s;
                    cursor: pointer;
                }

                .step-card:hover {
                    border-color: #1e3a5f;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }

                .step-card.active {
                    border-color: #1e3a5f;
                    border-width: 2px;
                }

                .step-header {
                    display: flex;
                    gap: 1.25rem;
                    align-items: flex-start;
                }

                .step-number {
                    flex-shrink: 0;
                    width: 48px;
                    height: 48px;
                    background: #1e3a5f;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Arial Black', sans-serif;
                    font-size: 1.25rem;
                    font-weight: 900;
                }

                .step-instruction {
                    flex: 1;
                    font-size: 1.125rem;
                    line-height: 1.7;
                    color: #1a1a1a;
                }

                .step-image-container {
                    margin-top: 1.5rem;
                    text-align: center;
                }

                .step-image-frame {
                    position: relative;
                    display: inline-flex;
                    align-items: stretch;
                    justify-content: center;
                    max-width: 100%;
                    overflow: hidden;
                }

                .step-image {
                    max-width: 100%;
                    max-height: 400px;
                    border: 1px solid #d0ccc4;
                    border-radius: 4px;
                    background: #fafafa;
                }

                .step-image-watermark {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%) rotate(180deg);
                    writing-mode: vertical-rl;
                    text-orientation: mixed;
                    font-family: 'Arial Black', sans-serif;
                    font-size: 0.7rem;
                    letter-spacing: 0.2em;
                    text-transform: uppercase;
                    color: rgba(30, 58, 95, 0.42);
                    background: linear-gradient(180deg, rgba(248, 246, 241, 0.9), rgba(248, 246, 241, 0.72));
                    padding: 0.6rem 0.3rem;
                    border: 1px solid rgba(209, 204, 196, 0.85);
                    border-radius: 999px;
                    pointer-events: none;
                    user-select: none;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                }

                .step-image-watermark-left {
                    left: 8px;
                }

                .step-image-watermark-right {
                    right: 8px;
                }

                .image-caption {
                    margin-top: 0.5rem;
                    font-size: 0.875rem;
                    color: #666;
                    font-style: italic;
                }

                .image-loading,
                .image-pending {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                    background: #f0ede6;
                    border: 1px dashed #d0ccc4;
                    border-radius: 4px;
                    min-height: 200px;
                }

                .image-loading-text {
                    margin-top: 0.5rem;
                    font-size: 0.8rem;
                    color: #999;
                    font-style: italic;
                }

                .step-connector {
                    text-align: center;
                    padding: 0.5rem 0;
                    color: #999;
                }

                .connector-arrow {
                    font-size: 1.5rem;
                }

                /* Sources */
                .sources-list {
                    background: white;
                    padding: 1.5rem;
                    border: 1px solid #d0ccc4;
                    border-radius: 8px;
                }

                .sources-intro {
                    margin-bottom: 1rem;
                    color: #666;
                    font-style: italic;
                }

                .sources-items {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .source-item {
                    display: flex;
                    gap: 0.75rem;
                    padding: 0.5rem 0;
                    border-bottom: 1px solid #f0f0f0;
                }

                .source-item:last-child {
                    border-bottom: none;
                }

                .source-number {
                    color: #1e3a5f;
                    font-weight: 700;
                    font-size: 0.875rem;
                }

                .source-link {
                    color: #2563eb;
                    text-decoration: none;
                }

                .source-link:hover {
                    text-decoration: underline;
                }

                @media (max-width: 640px) {
                    .step-image-watermark {
                        font-size: 0.6rem;
                        letter-spacing: 0.16em;
                        padding: 0.45rem 0.24rem;
                        opacity: 0.9;
                    }

                    .step-image-watermark-left {
                        left: 4px;
                    }

                    .step-image-watermark-right {
                        right: 4px;
                    }
                }

                @media print {
                    .step-image-frame {
                        overflow: visible;
                    }

                    .step-image-watermark {
                        color: rgba(30, 58, 95, 0.7);
                        background: rgba(255, 255, 255, 0.88);
                        box-shadow: none;
                    }
                }

            `}</style>
        </div>
    );
};

export default ServiceManualGuide;
