'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export type PanelType = 'parent' | 'sibling' | 'child' | 'dtc' | 'wiring' | 'torque';

interface SatellitePanelProps {
  id: string;
  title: string;
  type: PanelType;
  href?: string;
  children?: React.ReactNode;
  position: 'left' | 'right' | 'bottom';
  isOpen: boolean;
  onToggle: () => void;
  badge?: string;
}

const typeColors: Record<PanelType, string> = {
  parent: 'border-cyan-500/40 bg-cyan-500/5',
  sibling: 'border-white/10 bg-white/5',
  child: 'border-emerald-500/30 bg-emerald-500/5',
  dtc: 'border-amber-500/40 bg-amber-500/5',
  wiring: 'border-violet-500/40 bg-violet-500/5',
  torque: 'border-orange-500/40 bg-orange-500/5',
};

const typeGlow: Record<PanelType, string> = {
  parent: 'shadow-cyan-500/10',
  sibling: 'shadow-white/5',
  child: 'shadow-emerald-500/10',
  dtc: 'shadow-amber-500/10',
  wiring: 'shadow-violet-500/10',
  torque: 'shadow-orange-500/10',
};

const typeLabels: Record<PanelType, string> = {
  parent: 'System',
  sibling: 'Related',
  child: 'Section',
  dtc: 'DTC',
  wiring: 'Wiring',
  torque: 'Torque',
};

export default function SatellitePanel({
  id,
  title,
  type,
  href,
  children,
  position,
  isOpen,
  onToggle,
  badge,
}: SatellitePanelProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRotateY(((x - rect.width / 2) / (rect.width / 2)) * 6);
    setRotateX(-((y - rect.height / 2) / (rect.height / 2)) * 6);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const positionVariants = {
    left: {
      hidden: { x: -400, opacity: 0, rotateY: 15 },
      visible: { x: 0, opacity: 1, rotateY: 0 },
    },
    right: {
      hidden: { x: 400, opacity: 0, rotateY: -15 },
      visible: { x: 0, opacity: 1, rotateY: 0 },
    },
    bottom: {
      hidden: { y: 200, opacity: 0, rotateX: -10 },
      visible: { y: 0, opacity: 1, rotateX: 0 },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={positionVariants[position]}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative z-20"
          style={{ perspective: 1000 }}
        >
          <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`relative overflow-hidden rounded-xl border backdrop-blur-md ${typeColors[type]} ${typeGlow[type]} shadow-lg`}
            style={{
              transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
              transition: 'transform 0.2s ease-out',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    type === 'dtc'
                      ? 'bg-amber-400'
                      : type === 'wiring'
                        ? 'bg-violet-400'
                        : type === 'torque'
                          ? 'bg-orange-400'
                          : type === 'child'
                            ? 'bg-emerald-400'
                            : 'bg-cyan-400'
                  }`}
                />
                <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                  {typeLabels[type]}
                </span>
                {badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/50">
                    {badge}
                  </span>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
                className="text-white/30 hover:text-white/60 transition-colors text-xs"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            {href ? (
              <Link
                href={href}
                onClick={onToggle}
                className="block px-4 py-3 cursor-pointer"
              >
                <h4 className="text-sm font-semibold text-white/90 leading-snug mb-1">
                  {title}
                </h4>
                {children && <div className="text-xs text-white/50">{children}</div>}
              </Link>
            ) : (
              <div className="block px-4 py-3">
                <h4 className="text-sm font-semibold text-white/90 leading-snug mb-1">
                  {title}
                </h4>
                {children && <div className="text-xs text-white/50">{children}</div>}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
