import Link from 'next/link';
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
import { buildCodeNodeId } from '@/lib/knowledgeGraph';
import { buildKnowledgeGraphExport } from '@/lib/knowledgeGraphExport';
import { rankKnowledgeGraphBlocks } from '@/lib/knowledgeGraphRanking';
import { buildAmazonSearchUrl } from '@/lib/amazonAffiliate';
import { buildVehicleHubLinksForCode } from '@/lib/vehicleHubLinks';

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

export default function CodePageClient({
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
    const vehicleHubLinks = buildVehicleHubLinksForCode({
        code: code.code,
        repairLinks,
        wiringLinks,
        manualLinks,
        limit: 6,
    });
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
    ]);
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
                href: node.href,
                label: node.label,
                description: node.description,
                badge: node.badge,
                targetKind: node.targetKind,
            })),
        })),
    });

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

            {/* Quick Answer Box — featured snippet target */}
            <div className="mb-8 bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-6">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-2">What Does {code.code} Mean?</h3>
                <p className="text-white text-lg leading-relaxed">{code.description}</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Common Fix</p>
                        <p className="text-white font-semibold text-sm">{code.commonFix}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Estimated Cost (DIY)</p>
                        <p className="text-white font-semibold text-sm">{code.estimatedCostRange}</p>
                    </div>
                </div>
            </div>

            {/* Symptoms */}
            <div className="mb-8 bg-white/[0.03] border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Symptoms</h3>
                <ul className="space-y-2">
                    {code.symptoms.map((s, i) => (
                        <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                            <span className="text-amber-400 mt-0.5 shrink-0">⚠️</span>
                            {s}
                        </li>
                    ))}
                </ul>
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

            {/* OBD2 Scanner CTA */}
            <div className="mb-8 bg-amber-500/5 border border-amber-500/20 rounded-xl p-6 text-center">
                <p className="text-amber-200 text-sm mb-3">Need to read or clear this code?</p>
                <a
                    href={buildAmazonSearchUrl('obd2 scanner bluetooth')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-black text-sm font-bold rounded-lg hover:bg-amber-400 transition"
                >
                    Shop OBD2 Scanners on Amazon →
                </a>
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

            {/* Reverse knowledge graph */}
            {(manualLinks.length > 0 || repairLinks.length > 0 || wiringLinks.length > 0) && (
                <section className="mb-12">
                    <div className="mb-5">
                        <h3 className="text-xl font-bold text-white mb-2">Knowledge Paths from This Code</h3>
                        <p className="text-gray-400 text-sm">
                            These links connect {code.code} to the most relevant repair workflows and wiring surfaces across SpotOnAuto.
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
            <section className="mb-12">
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
                <section className="mb-12">
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
