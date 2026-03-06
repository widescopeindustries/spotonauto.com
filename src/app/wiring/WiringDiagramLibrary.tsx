'use client';

import React, { useState, useEffect, useCallback } from 'react';

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

// Static year range — CHARM covers 1982-2013
const YEARS = Array.from({ length: 2013 - 1982 + 1 }, (_, i) => 2013 - i);

export default function WiringDiagramLibrary() {
  // Vehicle selection state — Year → Make → Model
  const [makes, setMakes] = useState<string[]>([]);
  const [variants, setVariants] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');

  // Diagram state
  const [diagramData, setDiagramData] = useState<DiagramData | null>(null);
  const [expandedSystem, setExpandedSystem] = useState<string | null>(null);
  const [selectedDiagram, setSelectedDiagram] = useState<{ entry: DiagramEntry; images: DiagramImage } | null>(null);
  const [search, setSearch] = useState('');

  // Loading states
  const [loadingMakes, setLoadingMakes] = useState(true);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [loadingDiagrams, setLoadingDiagrams] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);

  // Fetch makes on mount (independent of year)
  useEffect(() => {
    fetch('/api/wiring?action=makes')
      .then(r => r.json())
      .then(d => { setMakes(d.makes || []); setLoadingMakes(false); })
      .catch(() => setLoadingMakes(false));
  }, []);

  // Clear downstream when year changes
  const handleYearChange = useCallback((year: string) => {
    setSelectedYear(year);
    setSelectedVariant('');
    setVariants([]);
    setDiagramData(null);
  }, []);

  // Clear downstream when make changes
  const handleMakeChange = useCallback((make: string) => {
    setSelectedMake(make);
    setSelectedVariant('');
    setVariants([]);
    setDiagramData(null);
  }, []);

  // Fetch variants when make + year both selected
  useEffect(() => {
    if (!selectedMake || !selectedYear) { setVariants([]); setSelectedVariant(''); return; }
    setLoadingVariants(true);
    setSelectedVariant('');
    setDiagramData(null);
    fetch(`/api/wiring?action=variants&make=${encodeURIComponent(selectedMake)}&year=${selectedYear}`)
      .then(r => r.json())
      .then(d => { setVariants(d.variants || []); setLoadingVariants(false); })
      .catch(() => setLoadingVariants(false));
  }, [selectedMake, selectedYear]);

  // Fetch diagrams when variant changes
  useEffect(() => {
    if (!selectedMake || !selectedYear || !selectedVariant) return;
    setLoadingDiagrams(true);
    setDiagramData(null);
    setExpandedSystem(null);
    setSelectedDiagram(null);
    fetch(`/api/wiring?action=diagrams&make=${encodeURIComponent(selectedMake)}&year=${selectedYear}&variant=${encodeURIComponent(selectedVariant)}`)
      .then(r => r.json())
      .then(d => { setDiagramData(d); setLoadingDiagrams(false); })
      .catch(() => setLoadingDiagrams(false));
  }, [selectedMake, selectedYear, selectedVariant]);

  const openDiagram = useCallback(async (entry: DiagramEntry) => {
    setLoadingImage(true);
    try {
      const resp = await fetch(`/api/wiring?action=image&url=${encodeURIComponent(entry.url)}`);
      const data = await resp.json();
      setSelectedDiagram({ entry, images: data });
    } catch {
      setSelectedDiagram({ entry, images: { images: [], title: entry.name } });
    }
    setLoadingImage(false);
  }, []);

  // Filter systems/diagrams by search term
  const filteredSystems = diagramData?.systems
    .map(sys => ({
      ...sys,
      diagrams: search
        ? sys.diagrams.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
        : sys.diagrams,
    }))
    .filter(sys => search ? sys.diagrams.length > 0 : true) || [];

  const filteredCount = filteredSystems.reduce((sum, s) => sum + s.diagrams.length, 0);

  return (
    <div className="wiring-library">
      {/* Header */}
      <header className="wl-header">
        <div className="wl-header-inner">
          <div className="wl-badge">FACTORY SERVICE MANUAL</div>
          <h1 className="wl-title">Wiring Diagram Library</h1>
          <p className="wl-subtitle">
            Original factory wiring diagrams, connector views, and electrical schematics.
            <br />Coverage: 1982&ndash;2013 &middot; All makes and models.
          </p>
        </div>
      </header>

      <main className="wl-main">
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
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="wl-dropdown-group">
              <label className="wl-label">Make</label>
              <select
                className="wl-select"
                value={selectedMake}
                onChange={e => handleMakeChange(e.target.value)}
                disabled={loadingMakes}
              >
                <option value="">{loadingMakes ? 'Loading...' : 'Select Make'}</option>
                {makes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="wl-dropdown-group">
              <label className="wl-label">Model / Engine</label>
              <select
                className="wl-select"
                value={selectedVariant}
                onChange={e => setSelectedVariant(e.target.value)}
                disabled={!selectedYear || !selectedMake || loadingVariants}
              >
                <option value="">{loadingVariants ? 'Loading...' : 'Select Model'}</option>
                {variants.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
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
                    onClick={() => setExpandedSystem(expandedSystem === sys.system ? null : sys.system)}
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
                          onClick={() => openDiagram(d)}
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
          <div className="wl-modal-overlay" onClick={() => setSelectedDiagram(null)}>
            <div className="wl-modal" onClick={e => e.stopPropagation()}>
              <div className="wl-modal-header">
                <h3 className="wl-modal-title">{selectedDiagram.images.title || selectedDiagram.entry.name}</h3>
                <button className="wl-modal-close" onClick={() => setSelectedDiagram(null)}>&times;</button>
              </div>
              <div className="wl-modal-body">
                {loadingImage ? (
                  <div className="wl-loading"><div className="wl-spinner" /><p>Loading diagram...</p></div>
                ) : selectedDiagram.images.images.length > 0 ? (
                  selectedDiagram.images.images.map((src, idx) => (
                    <div key={idx} className="wl-modal-img-wrap">
                      <img
                        src={src}
                        alt={`${selectedDiagram.entry.name} - Diagram ${idx + 1}`}
                        className="wl-modal-img"
                        loading="lazy"
                      />
                    </div>
                  ))
                ) : (
                  <div className="wl-empty">No diagram image found for this page.</div>
                )}
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
          background: rgba(0, 0, 0, 0.85);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .wl-modal {
          background: #0a0a0a;
          border: 1px solid rgba(0, 229, 255, 0.2);
          border-radius: 12px;
          max-width: 95vw;
          max-height: 95vh;
          width: 1000px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
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
          padding: 1.5rem;
          overflow-y: auto;
          flex: 1;
        }

        .wl-modal-img-wrap {
          background: white;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
          text-align: center;
        }

        .wl-modal-img {
          max-width: 100%;
          height: auto;
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

        @media (max-width: 640px) {
          .wl-title { font-size: 1.75rem; }
          .wl-main { padding: 1rem; }
          .wl-selector { padding: 1.25rem; }
          .wl-browser-header { padding: 1rem; }
          .wl-search { min-width: 180px; }
          .wl-system-header { padding: 0.875rem 1rem; }
          .wl-diagram-list { padding: 0 0.5rem 0.5rem 1rem; }
          .wl-modal { width: 100%; max-width: 100vw; border-radius: 8px; }
        }
      `}</style>
    </div>
  );
}
