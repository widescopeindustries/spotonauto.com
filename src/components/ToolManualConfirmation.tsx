import Link from 'next/link';
import type { ToolManualCitationGroup } from '@/lib/toolManualCitations';

interface ToolManualConfirmationProps {
  vehicleName: string;
  modelName: string;
  toolLabel: string;
  quickAnswer: string;
  verificationNote: string;
  manualNavigatorHref: string;
  makeManualHref: string;
  citationGroups: ToolManualCitationGroup[];
}

export default function ToolManualConfirmation({
  vehicleName,
  modelName,
  toolLabel,
  quickAnswer,
  verificationNote,
  manualNavigatorHref,
  makeManualHref,
  citationGroups,
}: ToolManualConfirmationProps) {
  return (
    <section className="mb-12 rounded-2xl border border-cyan-500/25 bg-cyan-950/20 p-6 md:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
          Factory Manual Confirmation
        </span>
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
          {toolLabel}
        </span>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Know the exact {toolLabel.toLowerCase()} job for your {vehicleName}
          </h2>
          <p className="mt-3 text-lg leading-relaxed text-white">
            {quickAnswer}
          </p>
          <p className="mt-4 text-sm leading-6 text-cyan-100/80">
            {verificationNote} Once the spec is confirmed, use the supplies and purchase links below to build the full one-trip shopping list before you start the repair.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-5">
          <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">
            Exact Vehicle Check
          </h3>
          <p className="mt-3 text-sm leading-6 text-gray-300">
            Use the archive navigator when you need the exact engine, trim, or production-branch manual instead of a broad year-range summary. That keeps the buying list and repair steps aligned with the real vehicle.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={manualNavigatorHref}
              className="inline-flex items-center justify-center rounded-lg bg-cyan-400 px-4 py-2 text-sm font-bold text-black transition hover:bg-cyan-300"
            >
              Open Manual Navigator
            </Link>
            <Link
              href={makeManualHref}
              className="inline-flex items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15"
            >
              Open {vehicleName} Manuals
            </Link>
          </div>
        </div>
      </div>

      {citationGroups.length > 0 ? (
        <div className="mt-8 grid gap-4 xl:grid-cols-3">
          {citationGroups.map((group) => (
            <div
              key={`${group.generationLabel}-${group.year}`}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-white">{group.generationLabel}</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-gray-400">
                    Representative {group.year} manual branch for {group.yearsLabel}
                  </p>
                </div>
                <Link
                  href={group.manualIndexHref}
                  className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300 hover:text-cyan-200"
                >
                  Open {group.year}
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {group.citations.map((citation) => (
                  <div key={citation.path} className="rounded-lg border border-cyan-500/15 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-white">{citation.sectionTitle}</h4>
                        {citation.model && citation.model !== modelName && (
                          <p className="mt-1 text-xs text-cyan-200/80">{citation.model}</p>
                        )}
                      </div>
                      <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
                        OEM
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-gray-300">{citation.contentPreview}</p>
                    <Link
                      href={citation.href}
                      className="mt-3 inline-flex items-center text-sm font-semibold text-cyan-300 hover:text-cyan-200"
                    >
                      Open factory section →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-white/15 bg-black/20 p-5 text-sm leading-6 text-gray-300">
          Live manual section citations are unavailable on this render. The exact-manual links above still route into the archive so the user can confirm the branch directly.
        </div>
      )}
    </section>
  );
}
