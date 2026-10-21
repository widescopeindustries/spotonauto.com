import React from 'react';
import { Wrench, ShieldAlert, ShoppingBag, ArrowUpRight } from 'lucide-react';
import AffiliateLink from '@/components/AffiliateLink';
import { buildAmazonSearchUrl } from '@/lib/amazonAffiliate';
import { getProWorkflowData } from '@/lib/proWorkflowData';

interface ProWorkflowMatrixProps {
  task: string;
  vehicleName: string;
  subtag?: string;
  className?: string;
}

export default function ProWorkflowMatrix({
  task,
  vehicleName,
  subtag,
  className = '',
}: ProWorkflowMatrixProps) {
  const workflow = getProWorkflowData(task, vehicleName);
  if (!workflow || workflow.steps.length === 0) return null;

  const activeSubtag = subtag || `pro-workflow-${task}`;

  return (
    <section
      id="pro-workflow-matrix"
      className={`mb-8 rounded-xl border border-slate-800 bg-slate-900/70 p-5 sm:p-7 shadow-sm ${className}`}
      aria-labelledby="pro-workflow-heading"
    >
      {/* Eyebrow badge */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
          <Wrench className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
          Professional Workshop Workflow
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
          4-Step Standard
        </span>
      </div>

      {/* Main heading */}
      <h2 id="pro-workflow-heading" className="mt-3 text-xl sm:text-2xl font-bold tracking-tight text-white">
        {workflow.title}
      </h2>
      <p className="mt-1.5 text-sm text-slate-300 leading-relaxed max-w-3xl">
        {workflow.subtitle}
      </p>

      {/* Pro Mechanic Golden Rule Banner */}
      {workflow.proMechanicNote && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-950/20 p-3.5 sm:p-4 text-amber-100">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" aria-hidden="true" />
          <div className="text-xs sm:text-sm leading-relaxed">
            <span className="font-bold text-amber-300 uppercase tracking-wider text-[11px] block sm:inline sm:mr-2">
              Master Tech Rule:
            </span>
            <span className="text-amber-100/90">{workflow.proMechanicNote}</span>
          </div>
        </div>
      )}

      {/* Desktop Structured Table (Ingested by Google & Copilot RAG) */}
      <div className="mt-5 hidden md:block overflow-hidden rounded-lg border border-slate-800 bg-slate-950/60">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-semibold uppercase tracking-wider text-slate-300">
              <th scope="col" className="py-3 pl-4 pr-2 w-16 text-center font-mono">Step</th>
              <th scope="col" className="py-3 px-3 w-1/4">Action & Milestone</th>
              <th scope="col" className="py-3 px-3 w-1/3">Exact Tool & Socket Size</th>
              <th scope="col" className="py-3 pl-3 pr-4">Shop Procedure Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {workflow.steps.map((s) => (
              <tr key={s.step} className="hover:bg-slate-900/40 transition-colors">
                <td className="py-3.5 pl-4 pr-2 text-center align-top">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-800 text-xs font-bold text-slate-200 border border-slate-700 font-mono">
                    {s.step}
                  </span>
                </td>
                <td className="py-3.5 px-3 align-top font-semibold text-white leading-snug">
                  {s.action}
                </td>
                <td className="py-3.5 px-3 align-top">
                  <div className="text-slate-200 font-medium leading-relaxed font-mono text-xs">
                    {s.tool}
                  </div>
                  <div className="mt-1.5">
                    <AffiliateLink
                      href={buildAmazonSearchUrl(s.toolQuery, 'automotive', `${activeSubtag}-step${s.step}`)}
                      partName={s.tool}
                      vehicle={vehicleName}
                      pageType="repair_guide"
                      subtag={`${activeSubtag}-step${s.step}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 transition-colors group/link"
                    >
                      <ShoppingBag className="h-3 w-3" />
                      <span>Check Tool Specifications</span>
                      <ArrowUpRight className="h-3 w-3 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                    </AffiliateLink>
                  </div>
                </td>
                <td className="py-3.5 pl-3 pr-4 align-top text-xs text-slate-300 leading-relaxed">
                  {s.tip}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Stack */}
      <div className="mt-4 md:hidden space-y-3">
        {workflow.steps.map((s) => (
          <div
            key={s.step}
            className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-2.5"
          >
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-800 text-xs font-bold text-slate-200 border border-slate-700 font-mono">
                {s.step}
              </span>
              <h3 className="font-semibold text-white text-sm leading-snug">
                {s.action}
              </h3>
            </div>

            <div className="rounded-md border border-slate-800 bg-slate-950/60 p-2.5">
              <div className="text-xs font-semibold text-slate-300">
                Tool Specification: <span className="text-slate-200 font-normal font-mono">{s.tool}</span>
              </div>
              <div className="mt-1.5">
                <AffiliateLink
                  href={buildAmazonSearchUrl(s.toolQuery, 'automotive', `${activeSubtag}-m-step${s.step}`)}
                  partName={s.tool}
                  vehicle={vehicleName}
                  pageType="repair_guide"
                  subtag={`${activeSubtag}-m-step${s.step}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
                >
                  <ShoppingBag className="h-3 w-3" />
                  <span>Check Tool Specs</span>
                  <ArrowUpRight className="h-3 w-3" />
                </AffiliateLink>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-300 bg-slate-800/50 p-2.5 rounded-md border-l-2 border-amber-400">
              <strong className="text-amber-300 font-semibold uppercase tracking-wider text-[10px] block mb-0.5">
                Shop Tip:
              </strong>
              {s.tip}
            </p>
          </div>
        ))}
      </div>

      {/* Compliance / Transparency Disclosure */}
      <p className="mt-4 text-[11px] text-slate-500 leading-relaxed uppercase tracking-wider">
        Affiliate disclosure: As an Amazon Associate, we earn from qualifying purchases on tool links at no extra cost to you.
      </p>
    </section>
  );
}
