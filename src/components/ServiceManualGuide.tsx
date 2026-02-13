'use client';

import React, { useState } from 'react';
import type { RepairGuide } from '../types';
import { generateToolLinks, generateAllPartsWithLinks } from '../services/affiliateService';
import { motion, AnimatePresence } from 'framer-motion';

interface ServiceManualGuideProps {
    guide: RepairGuide;
    onReset: () => void;
}

const ServiceManualGuide: React.FC<ServiceManualGuideProps> = ({ guide, onReset }) => {
    const [activeStep, setActiveStep] = useState<number | null>(null);

    const partsWithLinks = generateAllPartsWithLinks(guide.parts || [], guide.vehicle);

    return (
        <div className="service-manual">
            {/* Manual Cover/Header - Animated Entry */}
            <motion.header 
                className="manual-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <div className="manual-header-inner">
                    <div className="manual-badge">SERVICE MANUAL</div>
                    <motion.h1 
                        className="manual-title"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        {guide.title}
                    </motion.h1>
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
            </motion.header>

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
                        <motion.section 
                            id="safety" 
                            className="manual-page"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
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
                        </motion.section>
                    )}

                    {/* Page: Parts Required */}
                    {partsWithLinks.length > 0 && (
                        <motion.section 
                            id="parts" 
                            className="manual-page"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <div className="page-header">
                                <span className="page-icon">🔧</span>
                                <h2 className="page-title">Parts Required</h2>
                            </div>
                            <table className="parts-table">
                                <thead>
                                    <tr>
                                        <th>Part</th>
                                        <th>Shop Now</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {partsWithLinks.map((part, idx) => (
                                        <tr key={idx}>
                                            <td className="part-name">{part.name}</td>
                                            <td className="part-links">
                                                {part.links.map((link, linkIdx) => (
                                                    <a
                                                        key={linkIdx}
                                                        href={link.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`shop-link ${link.provider.toLowerCase()}`}
                                                    >
                                                        {link.provider}
                                                    </a>
                                                ))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </motion.section>
                    )}

                    {/* Page: Tools Needed */}
                    {guide.tools && guide.tools.length > 0 && (
                        <motion.section 
                            id="tools" 
                            className="manual-page"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
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
                                                <a href={links[0].url} target="_blank" rel="noopener noreferrer" className="tool-buy">
                                                    Buy
                                                </a>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.section>
                    )}

                    {/* Page: Procedure Steps */}
                    <section id="procedure" className="manual-page procedure-section">
                        <div className="page-header">
                            <span className="page-icon">📋</span>
                            <h2 className="page-title">Repair Procedure</h2>
                        </div>

                        <div className="steps-container">
                            {guide.steps?.map((step, idx) => (
                                <motion.div
                                    key={step.step}
                                    id={`step-${step.step}`}
                                    className={`step-card ${activeStep === step.step ? 'active' : ''}`}
                                    onClick={() => setActiveStep(activeStep === step.step ? null : step.step)}
                                    
                                    // Storytelling Animation: Slide in from bottom-left like a timeline entry
                                    initial={{ opacity: 0, x: -50, y: 20 }}
                                    whileInView={{ opacity: 1, x: 0, y: 0 }}
                                    viewport={{ once: true, margin: "-100px" }} // Trigger when 100px into view
                                    transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
                                >
                                    <div className="step-header">
                                        <motion.div 
                                            className="step-number"
                                            initial={{ scale: 0 }}
                                            whileInView={{ scale: 1 }}
                                            transition={{ delay: 0.2, type: "spring" }}
                                        >
                                            {step.step}
                                        </motion.div>
                                        <div className="step-instruction">
                                            {step.instruction}
                                        </div>
                                    </div>


                                    {idx < (guide.steps?.length || 0) - 1 && (
                                        <div className="step-connector">
                                            <motion.div 
                                                className="connector-line"
                                                initial={{ height: 0 }}
                                                whileInView={{ height: '40px' }} // Approximate height
                                                transition={{ duration: 0.5, delay: 0.4 }} // Wait for card to settle
                                                style={{ 
                                                    width: '2px', 
                                                    background: '#d0ccc4', 
                                                    margin: '0 auto', 
                                                    transformOrigin: 'top' 
                                                }}
                                            />
                                            <motion.div 
                                                className="connector-arrow"
                                                initial={{ opacity: 0 }}
                                                whileInView={{ opacity: 1 }}
                                                transition={{ delay: 0.9 }} // Show arrow after line grows
                                            >
                                                ↓
                                            </motion.div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* Page: Sources */}
                    {guide.sources && guide.sources.length > 0 && (
                        <motion.section 
                            id="sources" 
                            className="manual-page"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                        >
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
                                            <a href={source.uri} target="_blank" rel="noopener noreferrer" className="source-link">
                                                {source.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </motion.section>
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

                /* Parts Table */
                .parts-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }

                .parts-table th {
                    background: #1e3a5f;
                    color: white;
                    padding: 1rem;
                    text-align: left;
                    font-family: 'Arial', sans-serif;
                    font-weight: 700;
                    font-size: 0.875rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .parts-table td {
                    padding: 1rem;
                    border-bottom: 1px solid #e5e5e5;
                }

                .parts-table tr:last-child td {
                    border-bottom: none;
                }

                .part-name {
                    font-weight: 500;
                }

                .part-links {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }

                .shop-link {
                    padding: 0.375rem 0.75rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-decoration: none;
                    text-transform: uppercase;
                    transition: all 0.2s;
                }

                .shop-link.amazon {
                    background: #ff9900;
                    color: #111;
                }

                .shop-link.amazon:hover {
                    background: #e88b00;
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

                .step-image {
                    max-width: 100%;
                    max-height: 400px;
                    border: 1px solid #d0ccc4;
                    border-radius: 4px;
                    background: #fafafa;
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
            `}</style>
        </div>
    );
};

export default ServiceManualGuide;
