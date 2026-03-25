import Link from 'next/link';
import type { KnowledgeGraphContext, KnowledgeGraphKind, KnowledgeGraphSurface } from '@/lib/analytics';
import type { KnowledgeGraphReference } from '@/lib/knowledgeGraph';

export type KnowledgeGraphTheme = 'cyan' | 'emerald' | 'amber' | 'violet' | 'slate';

export interface KnowledgeGraphGroupNode extends KnowledgeGraphReference {
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
    container: 'border-cyan-500/20 bg-cyan-500/[0.04]',
    title: 'text-cyan-300',
    link: 'text-cyan-400',
    badge: 'text-cyan-300',
    card: 'border-cyan-500/20 hover:border-cyan-400/35',
  },
  emerald: {
    container: 'border-emerald-500/20 bg-emerald-500/[0.04]',
    title: 'text-emerald-300',
    link: 'text-emerald-400',
    badge: 'text-emerald-300',
    card: 'border-emerald-500/20 hover:border-emerald-400/35',
  },
  amber: {
    container: 'border-amber-500/20 bg-amber-500/[0.04]',
    title: 'text-amber-300',
    link: 'text-amber-400',
    badge: 'text-amber-300',
    card: 'border-amber-500/20 hover:border-amber-400/35',
  },
  violet: {
    container: 'border-violet-500/20 bg-violet-500/[0.04]',
    title: 'text-violet-300',
    link: 'text-violet-400',
    badge: 'text-violet-300',
    card: 'border-violet-500/20 hover:border-violet-400/35',
  },
  slate: {
    container: 'border-slate-500/20 bg-slate-500/[0.08]',
    title: 'text-slate-200',
    link: 'text-slate-300',
    badge: 'text-slate-300',
    card: 'border-slate-500/20 hover:border-slate-400/35',
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

  const impressionData = JSON.stringify({
    event_category: 'kg_impression',
    surface,
    groupKind,
    title,
    nodeCount: nodes.length,
    vehicle: context?.vehicle,
    task: context?.task,
  });

  return (
    <div
      className={`rounded-2xl border p-5 md:p-6 ${classes.container}`}
      data-track-impression={impressionData}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className={`text-base font-semibold tracking-tight ${classes.title}`}>{title}</h3>
        {browseHref && (
          <Link
            href={browseHref}
            className={`text-sm hover:underline ${classes.link}`}
            data-track-click={JSON.stringify({
              event_category: 'kg_click',
              surface,
              sourceKind: groupKind,
              targetKind: groupKind,
              label: `Browse ${title}`,
              href: browseHref,
              isBrowseLink: true,
              vehicle: context?.vehicle,
            })}
          >
            Browse →
          </Link>
        )}
      </div>
      <div className="space-y-3">
        {nodes.map((node) => (
          <Link
            key={node.nodeId || `${groupKind}-${node.targetKind}-${node.href}-${node.label}`}
            href={node.href}
            className={`block rounded-xl border bg-slate-900/45 p-4 transition-all hover:bg-slate-900/65 ${classes.card}`}
            data-track-click={JSON.stringify({
              event_category: 'kg_click',
              surface,
              sourceKind: groupKind,
              targetKind: node.targetKind,
              label: node.label,
              href: node.href,
              vehicle: context?.vehicle,
            })}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium leading-6 text-white">{node.label}</span>
              <span className={`text-[11px] font-medium tracking-wide ${classes.badge}`}>
                {node.badge}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-gray-300">{node.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
