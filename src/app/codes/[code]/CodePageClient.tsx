import Link from 'next/link';
import { isTier1RescueHref } from '@/data/rescuePriority';
import { buildSymptomHref, getSymptomClustersForTexts } from '@/data/symptomGraph';
import type { DTCCode } from '@/data/dtc-codes-data';
import AdUnit from '@/components/AdUnit';
import LiveDtcFlowchart from '@/components/LiveDtcFlowchart';
import KnowledgeGraphGroup from '@/components/KnowledgeGraphGroup';
import {
    type DiagnosticCrossLink,
    getRelatedCodeLinks,
    getRepairLinksForCode,
    getWiringLinksForCode,
} from '@/lib/diagnosticCrossLinks';
import { buildCodeNodeId, buildEdgeReference, buildSymptomNodeId } from '@/lib/knowledgeGraph';
import { buildKnowledgeGraphExport } from '@/lib/knowledgeGraphExport';
import { rankKnowledgeGraphBlocks } from '@/lib/knowledgeGraphRanking';
import { getSupportGapRepairsForTasks } from '@/lib/graphPriorityLinks';
import { buildAmazonSearchUrl } from '@/lib/amazonAffiliate';
import { buildTopdonProductUrl, getTopdonRecommendations, getContextFromCode } from '@/lib/topdonAffiliate';
import TopdonProductCard from '@/components/TopdonProductCard';
import { buildVehicleHubLinksForCodeViaGateway } from '@/lib/vehicleHubGateway';
import { PricingTrackedLink } from '@/components/PricingTracking';
import SearchLandingMonetizationRail from '@/components/SearchLandingMonetizationRail';
import ConversionZone from '@/components/ConversionZone';
import AuthorBioCard from '@/components/AuthorBioCard';

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    low: { label: 'Low Severity', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
    medium: { label: 'Medium Severity', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    high: { label: 'High Severity', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    critical: { label: 'Critical', color: 'text-red-500', bg: 'bg-red-500/20', border: 'border-red-500/40' },
};

const LIKELIHOOD_BADGE: Record<string, string> = {
    likely: 'bg-green-500/10 text-green-400 border-green-500/30',
    possible: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    unlikely: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
};

export default async function CodePageClient({
    code,
    manualLinks = [],
}: {
    code: DTCCode;
    manualLinks?: DiagnosticCrossLink[];
}) {
    const sev = SEVERITY_CONFIG[code.severity] || SEVERITY_CONFIG.medium;
    const repairLinks = getRepairLinksForCode(code, 6);
    const wiringLinks = getWiringLinksForCode(code, 6);
    const relatedCodeLinks = getRelatedCodeLinks(code, 6);
    const tier1RepairLinks = repairLinks.filter((link) => isTier1RescueHref(link.href)).slice(0, 4);
    const supportGapRepairLinks = code.repairTaskSlug
        ? getSupportGapRepairsForTasks([code.repairTaskSlug], 4)
            .filter((entry) => !repairLinks.some((link) => link.href === entry.href))
        : [];
    const symptomHubLinks = getSymptomClustersForTexts([
        ...code.symptoms,
        code.title,
        code.description,
        code.commonFix,
    ], 4).map((cluster) => ({
        ...buildEdgeReference({
            sourceNodeId: buildCodeNodeId(code.code),
            targetNodeId: buildSymptomNodeId(cluster.slug),
            relation: 'has-symptom',
            code: code.code,
        }),
        href: buildSymptomHref(cluster.slug),
        label: cluster.label,
        description: cluster.summary,
        badge: 'Symptom Hub',
        targetKind: 'symptom' as const,
    }));
    let vehicleHubLinks: Awaited<ReturnType<typeof buildVehicleHubLinksForCodeViaGateway>> = [];
    try {
        vehicleHubLinks = await buildVehicleHubLinksForCodeViaGateway({
            code: code.code,
            repairLinks,
            wiringLinks,
            manualLinks,
            limit: 6,
        });
    } catch (error) {
        console.warn(`[codes] vehicle hub links unavailable for ${code.code}`, error);
    }
    const graphBlocks = rankKnowledgeGraphBlocks('code', [
        ...(vehicleHubLinks.length > 0 ? [{
            kind: 'vehicle' as const,
            title: 'Exact Vehicle Hubs',
            browseHref: '/repair',
            theme: 'emerald' as const,
            nodes: vehicleHubLinks.map((link) => ({
                ...link,
                targetKind: 'vehicle' as const,
            })),
        }] : []),
        ...(manualLinks.length > 0 ? [{
            kind: 'manual' as const,
            title: 'OEM Manual Evidence',
            browseHref: '/manual',
            theme: 'slate' as const,
            nodes: manualLinks.map((link) => ({
                ...link,
                targetKind: 'manual' as const,
            })),
        }] : []),
        ...(symptomHubLinks.length > 0 ? [{
            kind: 'symptom' as const,
            title: 'Related Symptoms',
            browseHref: '/symptoms',
            theme: 'amber' as const,
            nodes: symptomHubLinks,
        }] : []),
        ...(repairLinks.length > 0 ? [{
            kind: 'repair' as const,
            title: 'Exact Repair Workflows',
            browseHref: '/repair',
            theme: 'cyan' as const,
            nodes: repairLinks.map((link) => ({
                ...link,
                targetKind: 'repair' as const,
            })),
        }] : []),
        ...(wiringLinks.length > 0 ? [{
            kind: 'wiring' as const,
            title: 'Wiring Diagram Paths',
            browseHref: '/wiring',
            theme: 'violet' as const,
            nodes: wiringLinks.map((link) => ({
                ...link,
                targetKind: 'wiring' as const,
            })),
        }] : []),
    ], {
        code: code.code,
        system: code.affectedSystem,
        task: code.repairTaskSlug,
        query: `${code.code} ${code.title} ${code.commonFix} ${code.affectedSystem}`.trim(),
    });
    const knowledgeGraphExport = buildKnowledgeGraphExport({
        surface: 'code',
        rootNodeId: buildCodeNodeId(code.code),
        rootKind: 'dtc',
        rootLabel: `${code.code}: ${code.title}`,
        blocks: graphBlocks.map((block) => ({
            kind: block.kind,
            title: block.title,
            browseHref: block.browseHref,
            nodes: block.nodes.map((node) => ({
                nodeId: node.nodeId,
                edgeId: node.edgeId,
                sourceNodeId: node.sourceNodeId,
                targetNodeId: node.targetNodeId,
                vehicleNodeId: node.vehicleNodeId,
                taskNodeId: node.taskNodeId,
                systemNodeId: node.systemNodeId,
                codeNodeId: node.codeNodeId,
        confidence: 'confidence' in node ? node.confidence : undefined,
        evidence: 'evidence' in node ? node.evidence : undefined,
                href: node.href,
                label: node.label,
                description: node.description,
                badge: node.badge,
                targetKind: node.targetKind,
            })),
        })),
    });
    const flashingRisk = code.severity === 'critical' || code.severity === 'high';
    const safeToDrive = flashingRisk
        ? 'NO if CEL is flashing. YES with caution if solid, but repair this week.'
        : 'Usually yes with caution, but confirm root cause before long trips.';
    const topCauseStats = code.commonCauses.slice(0, 5).map((cause, idx) => {
        if (cause.likelihood === 'likely') return `${idx + 1}. ${cause.cause} (35-45% of cases)`;
        if (cause.likelihood === 'possible') return `${idx + 1}. ${cause.cause} (10-25% of cases)`;
        return `${idx + 1}. ${cause.cause} (5-10% of cases)`;
    });
    const schemaDate = new Date().toISOString().slice(0, 10);

    return (
        <section className="py-16 px-4 max-w-4xl mx-auto">
            <script
                id="knowledge-graph-export"
                type="application/json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(knowledgeGraphExport) }}
            />
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                <Link href="/" className="hover:text-cyan-400 transition">Home</Link>
                <span>/</span>
                <Link href="/codes" className="hover:text-cyan-400 transition">DTC Codes</Link>
                <span>/</span>
                <span className="text-white font-mono">{code.code}</span>
            </nav>

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                    <h1 className="text-3xl md:text-4xl font-bold">
                        <span className="text-cyan-400 font-mono">{code.code}</span>
                    </h1>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${sev.bg} ${sev.color} ${sev.border}`}>
                        {sev.label}
                    </span>
                </div>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-2">{code.title}</h2>
                <p className="text-sm text-gray-400">{code.affectedSystem} System</p>
            </div>

            <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs">
                <a href="#answer" className="text-cyan-300 hover:text-cyan-100">Answer Box</a>
                <a href="#diagnose-steps" className="text-cyan-300 hover:text-cyan-100">Diagnosis Flow</a>
                <a href="#faq" className="text-cyan-300 hover:text-cyan-100">FAQ</a>
                <a href="#related-repairs" className="text-cyan-300 hover:text-cyan-100">Related Repairs</a>
            </div>

            {/* Quick Answer Box — featured snippet target */}
            <div id="answer" className="answer-box mb-8">
                <h2>{code.code} — Instant Answer</h2>
                <p className="primary-answer">{code.title}</p>
                <p><strong>Severity:</strong> {sev.label.toUpperCase()}</p>
                <p><strong>Meaning:</strong> {code.description}</p>
                <p><strong>Safe to drive?</strong> {safeToDrive}</p>
                <p><strong>Estimated repair cost:</strong> {code.estimatedCostRange}</p>
                <p className="mt-3"><strong>Most common causes:</strong></p>
                <ul className="mt-2 list-disc pl-6">
                    {topCauseStats.map((cause) => (
                        <li key={cause}>{cause}</li>
                    ))}
                </ul>
            </div>

            {/* Symptoms */}
            <div id="diagnose-steps" className="mb-8 bg-white/[0.03] border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Symptoms</h3>
                <ul className="space-y-2">
                    {code.symptoms.map((s, i) => (
                        <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                            <span className="text-amber-400 mt-0.5 shrink-0">⚠️</span>
                            {s}
                        </li>
                    ))}
                </ul>
                {symptomHubLinks.length > 0 && (
                    <div className="mt-5 border-t border-white/10 pt-4">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300 mb-3">Related Symptoms</p>
                        <div className="flex flex-wrap gap-2">
                            {symptomHubLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-amber-100 hover:border-amber-400/35 hover:bg-amber-500/15 transition-all"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Common Causes */}
            <div className="mb-8 bg-white/[0.03] border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Common Causes</h3>
                <div className="space-y-3">
                    {code.commonCauses.map((c, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                            <span className="text-gray-300 text-sm">{c.cause}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${LIKELIHOOD_BADGE[c.likelihood]}`}>
                                {c.likelihood}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Diagnostic Steps */}
            <div className="mb-8 bg-white/[0.03] border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">How to Diagnose {code.code}</h3>
                <ol className="space-y-3">
                    {code.diagnosticSteps.map((step, i) => (
                        <li key={i} className="flex items-start gap-3">
                            <span className="shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center mt-0.5">
                                {i + 1}
                            </span>
                            <span className="text-gray-300 text-sm">{step}</span>
                        </li>
                    ))}
                </ol>
            </div>

            <LiveDtcFlowchart code={code.code} />

            {/* Ad placement */}
            <AdUnit slot="code-after-diagnosis" />

            {/* Scanner & Diagnostic Tool CTA */}
            {(() => {
                const ctx = getContextFromCode(code.code);
                const topdonPicks = getTopdonRecommendations(ctx);
                const ctaText = ctx === 'advanced'
                    ? `${code.code} requires a scanner that reads ${code.code.startsWith('B') ? 'body' : code.code.startsWith('C') ? 'chassis' : 'network'} modules — basic code readers won't see it.`
                    : ctx === 'battery'
                    ? 'Test your battery and charging system before replacing parts.'
                    : `Read live data and freeze frame for ${code.code} to pinpoint the cause before buying parts.`;
                return (
            <div className="mb-8">
                <p className="text-gray-300 text-sm mb-4">{ctaText}</p>
                <div className="grid sm:grid-cols-2 gap-4">
                            {topdonPicks.map((product, i) => (
                                <TopdonProductCard
                                    key={product.slug}
                                    product={product}
                                    badge={i === 0 ? 'Recommended' : undefined}
                                    surface={`code-page-${code.code}`}
                                    compact
                                />
                            ))}
                        </div>
                        <div className="mt-4 rounded-xl border border-cyan-500/25 bg-cyan-500/10 p-4">
                            <p className="text-sm text-cyan-100">
                                Got a repair estimate for {code.code}? Check if the quote is fair before ordering parts.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-3">
                                <PricingTrackedLink
                                    href="/second-opinion"
                                    target="starter_free"
                                    label={`code_${code.code.toLowerCase()}_quote_check`}
                                    className="inline-flex items-center justify-center rounded-lg bg-cyan-300 px-4 py-2 text-sm font-bold text-black transition hover:bg-cyan-200"
                                >
                                    Free Quote Check
                                </PricingTrackedLink>
                                <PricingTrackedLink
                                    href="/pricing"
                                    target="pro_waitlist"
                                    label={`code_${code.code.toLowerCase()}_quote_pro`}
                                    className="inline-flex items-center justify-center rounded-lg border border-cyan-200/40 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-100 hover:text-white"
                                >
                                    Quote Shield Pro
                                </PricingTrackedLink>
                            </div>
                        </div>
                    </div>
                );
            })()}

            <div className="mb-8">
                <SearchLandingMonetizationRail
                    surface="codes_index"
                    intent="diagnostic"
                    contextLabel={`${code.code} ${code.title}`}
                    className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-6 md:p-8"
                />
            </div>


            {/* Repair link */}
            {code.repairTaskSlug && (
                <div className="mb-8 bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-6 text-center">
                    <p className="text-cyan-200 text-sm mb-3">Ready to fix it yourself?</p>
                    <Link
                        href={`/repair`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-black text-sm font-bold rounded-lg hover:bg-cyan-400 transition"
                    >
                        Find My Vehicle Repair Guide →
                    </Link>
                    <p className="text-gray-600 text-xs mt-2">Select your exact vehicle for a personalized step-by-step guide</p>
                </div>
            )}

            {(tier1RepairLinks.length > 0 || supportGapRepairLinks.length > 0) && (
                <section className="mb-12 rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Priority exact repair pages for this code family</h3>
                    <p className="text-gray-300 text-sm mb-5">
                        Popular repair guides related to this code.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                        {tier1RepairLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="rounded-xl bg-black/20 border border-white/10 p-4 hover:border-violet-400/40 transition"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-violet-300 font-mono text-sm">{link.label}</span>
                                    <span className="text-[11px] uppercase tracking-wider text-violet-200/80">Popular guide</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-2 leading-relaxed">{link.description}</p>
                            </Link>
                        ))}
                        {supportGapRepairLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="rounded-xl bg-black/20 border border-white/10 p-4 hover:border-violet-400/40 transition"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-violet-300 font-mono text-sm">{link.label}</span>
                                    <span className="text-[11px] uppercase tracking-wider text-violet-200/80">Repair guide</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                                    Related repair guide for vehicles with {code.code}.
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Reverse knowledge graph */}
            {(manualLinks.length > 0 || symptomHubLinks.length > 0 || repairLinks.length > 0 || wiringLinks.length > 0) && (
                <section className="mb-12">
                    <div className="mb-5">
                        <h3 className="text-xl font-bold text-white mb-2">Related Resources</h3>
                        <p className="text-gray-400 text-sm">
                            Repair guides, symptom pages, and wiring diagrams related to {code.code}.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6">
                        {graphBlocks.map((block) => (
                            <KnowledgeGraphGroup
                                key={block.kind}
                                surface="code"
                                groupKind={block.kind}
                                title={block.title}
                                browseHref={block.browseHref}
                                theme={block.theme}
                                nodes={block.nodes}
                                context={{ code: code.code, task: code.repairTaskSlug }}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Related Codes */}
            {relatedCodeLinks.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-4">Related Codes</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                        {relatedCodeLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="rounded-xl bg-white/5 border border-white/10 p-4 hover:border-cyan-500/40 transition"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-cyan-400 font-mono text-sm">{link.label}</span>
                                    <span className="text-[11px] uppercase tracking-wider text-gray-500">{link.badge}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-2 leading-relaxed">{link.description}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* FAQ */}
            <section id="faq" className="mb-12">
                <h3 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h3>
                <dl className="space-y-4">
                    {code.faq.map((f, i) => (
                        <div key={i} className="bg-white/[0.03] rounded-xl border border-white/10 overflow-hidden">
                            <dt className="px-5 py-4 font-semibold text-white">{f.q}</dt>
                            <dd className="px-5 pb-4 text-gray-400 text-sm leading-relaxed">{f.a}</dd>
                        </div>
                    ))}
                </dl>
            </section>

            {/* Ad after FAQ */}
            <AdUnit slot="code-after-faq" format="horizontal" />

            {/* Related Repair Guides — cross-links to repair pages */}
            {repairLinks.length > 0 && (
                <section id="related-repairs" className="mb-12">
                    <h3 className="text-xl font-bold text-white mb-4">Related Repair Guides</h3>
                    <p className="text-gray-400 text-sm mb-4">
                        If your vehicle has triggered {code.code}, these DIY repair guides may help:
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                        {repairLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.06] transition-all group"
                            >
                                <span className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0" />
                                <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
                                    {link.label}
                                </span>
                            </Link>
                        ))}
                    </div>
                    <Link href="/guides" className="inline-block mt-4 text-cyan-400 text-sm hover:underline">
                        Browse all vehicle repair guides →
                    </Link>
                </section>
            )}

            <ConversionZone
                vehicleLabel={`${code.code} drivers`}
                intentLabel={`${code.code} ${code.title}`}
            />

            <AuthorBioCard updatedDate={schemaDate} />

            {/* Bottom CTA */}
            <div className="text-center py-8 border-t border-white/10 mt-8">
                <p className="text-gray-400 mb-4">Need a diagnosis for your specific vehicle?</p>
                <Link
                    href="/diagnose"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition text-lg"
                >
                    Start Free AI Diagnosis →
                </Link>
                <p className="text-gray-600 text-sm mt-3">100% Free — No signup required</p>
            </div>
        </section>
    );
}
