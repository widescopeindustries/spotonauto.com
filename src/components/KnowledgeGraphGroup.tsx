'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import {
  trackKnowledgeGraphClick,
  trackKnowledgeGraphImpression,
  type KnowledgeGraphContext,
  type KnowledgeGraphKind,
  type KnowledgeGraphSurface,
} from '@/lib/analytics';

export type KnowledgeGraphTheme = 'cyan' | 'emerald' | 'amber' | 'violet' | 'slate';

export interface KnowledgeGraphGroupNode {
  href: string;
  label: string;
  description: string;
  badge: string;
  targetKind: KnowledgeGraphKind;
}

interface KnowledgeGraphGroupProps {
  surface: KnowledgeGraphSurface;
  groupKind: KnowledgeGraphKind;
  title: string;
  browseHref?: string;
  theme: KnowledgeGraphTheme;
  nodes: KnowledgeGraphGroupNode[];
  context?: KnowledgeGraphContext;
}

const THEME_CLASSES: Record<KnowledgeGraphTheme, {
  container: string;
  title: string;
  link: string;
  badge: string;
  card: string;
}> = {
  cyan: {
    container: 'border-cyan-500/20 bg-cyan-500/5',
    title: 'text-cyan-300',
    link: 'text-cyan-400',
    badge: 'text-cyan-300',
    card: 'border-cyan-500/20 hover:border-cyan-400/40',
  },
  emerald: {
    container: 'border-emerald-500/20 bg-emerald-500/5',
    title: 'text-emerald-300',
    link: 'text-emerald-400',
    badge: 'text-emerald-300',
    card: 'border-emerald-500/20 hover:border-emerald-400/40',
  },
  amber: {
    container: 'border-amber-500/20 bg-amber-500/5',
    title: 'text-amber-300',
    link: 'text-amber-400',
    badge: 'text-amber-300',
    card: 'border-amber-500/20 hover:border-amber-400/40',
  },
  violet: {
    container: 'border-violet-500/20 bg-violet-500/5',
    title: 'text-violet-300',
    link: 'text-violet-400',
    badge: 'text-violet-300',
    card: 'border-violet-500/20 hover:border-violet-400/40',
  },
  slate: {
    container: 'border-slate-500/20 bg-slate-500/10',
    title: 'text-slate-200',
    link: 'text-slate-300',
    badge: 'text-slate-300',
    card: 'border-slate-500/20 hover:border-slate-400/40',
  },
};

export default function KnowledgeGraphGroup({
  surface,
  groupKind,
  title,
  browseHref,
  theme,
  nodes,
  context,
}: KnowledgeGraphGroupProps) {
  const classes = THEME_CLASSES[theme];
  const hasTrackedImpression = useRef(false);

  useEffect(() => {
    if (!nodes.length || hasTrackedImpression.current) return;
    trackKnowledgeGraphImpression({
      surface,
      groupKind,
      title,
      nodeCount: nodes.length,
      ...context,
    });
    hasTrackedImpression.current = true;
  }, [surface, groupKind, title, nodes.length, context?.vehicle, context?.task, context?.code, context?.system]);

  return (
    <div className={`rounded-2xl border p-5 ${classes.container}`}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className={`text-base font-bold ${classes.title}`}>{title}</h3>
        {browseHref && (
          <Link
            href={browseHref}
            className={`text-xs hover:underline ${classes.link}`}
            onClick={() => trackKnowledgeGraphClick({
              surface,
              sourceKind: groupKind,
              targetKind: groupKind,
              label: `Browse ${title}`,
              href: browseHref,
              isBrowseLink: true,
              ...context,
            })}
          >
            Browse →
          </Link>
        )}
      </div>
      <div className="space-y-3">
        {nodes.map((node) => (
          <Link
            key={`${groupKind}-${node.targetKind}-${node.href}-${node.label}`}
            href={node.href}
            className={`block rounded-xl border bg-black/20 p-4 hover:bg-black/30 transition-all ${classes.card}`}
            onClick={() => trackKnowledgeGraphClick({
              surface,
              sourceKind: groupKind,
              targetKind: node.targetKind,
              label: node.label,
              href: node.href,
              ...context,
            })}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-white">{node.label}</span>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${classes.badge}`}>
                {node.badge}
              </span>
            </div>
            <p className="text-sm text-gray-300 mt-2">{node.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
