'use client';

import { useEffect, useRef, useState } from 'react';

interface PanelRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ConnectionLinesProps {
  panels: PanelRect[];
  activePanelId: string;
}

export default function ConnectionLines({ panels, activePanelId }: ConnectionLinesProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    setDimensions({ width: window.innerWidth, height: window.innerHeight });
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activePanel = panels.find((p) => p.id === activePanelId);

  if (!activePanel || panels.length < 2) return null;

  const cx = activePanel.x + activePanel.width / 2;
  const cy = activePanel.y + activePanel.height / 2;

  return (
    <svg
      ref={svgRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#FF6B00" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.4" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {panels
        .filter((p) => p.id !== activePanelId)
        .map((panel) => {
          const px = panel.x + panel.width / 2;
          const py = panel.y + panel.height / 2;
          return (
            <line
              key={panel.id}
              x1={cx}
              y1={cy}
              x2={px}
              y2={py}
              stroke="url(#lineGradient)"
              strokeWidth="1.5"
              filter="url(#glow)"
              opacity="0.6"
              strokeDasharray="4 4"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="8"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </line>
          );
        })}
    </svg>
  );
}
