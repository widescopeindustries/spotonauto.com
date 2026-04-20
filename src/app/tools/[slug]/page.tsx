import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
    getHighPriorityToolPages,
    getToolPage,
    TOOL_TYPE_META,
    getToolPagesForType,
    getToolPagesForVehicle,
    getRelatedRepairLinks,
} from '@/data/tools-pages';
import AdUnit from '@/components/AdUnit';
import ToolManualConfirmation from '@/components/ToolManualConfirmation';
import MaintenanceSupplies from '@/components/MaintenanceSupplies';
import ToolIntentCommerce from '@/components/ToolIntentCommerce';
import AffiliateLink from '@/components/AffiliateLink';
import { buildAmazonSearchUrl } from '@/lib/amazonAffiliate';
import { getToolManualCitationGroups, getToolVerificationNote } from '@/lib/toolManualCitations';

interface PageProps {
    params: Promise<{ slug: string }>;
}

/**
 * Pre-render only the highest-priority pages for faster builds and stronger
 * crawl freshness on pages with the highest search intent.
 * Remaining pages are ISR-rendered on first request and then cached.
 */
const TOOL_PREBUILD_LIMIT = 320;

// Cache dynamically-rendered tool pages for 24 hours — prevents re-rendering
// on every crawl request and ensures non-prebuilt pages serve fast.
export const revalidate = 86400;

export async function generateStaticParams() {
    return getHighPriorityToolPages(TOOL_PREBUILD_LIMIT).map((tp) => ({ slug: tp.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const page = getToolPage(slug);
    if (!page) return { title: 'Tool Not Found' };

    // Lead description with the quick answer so actual specs appear in SERP snippet
    const description = page.quickAnswer
        ? `${page.quickAnswer} All years covered with part numbers — free lookup.`
        : page.description;

    return {
        title: page.title,
        description,
        keywords: page.keywords,
        openGraph: {
            title: page.title,
            description,
            type: 'article',
            url: `https://spotonauto.com/tools/${page.slug}`,
        },
        twitter: {
            card: 'summary',
            title: page.title,
            description,
        },
        alternates: {
            canonical: `https://spotonauto.com/tools/${page.slug}`,
        },
    };
}

export default async function ToolPage({ params }: PageProps) {
    const { slug } = await params;
    const page = getToolPage(slug);
    if (!page) notFound();

    const makeSlug = page.make.toLowerCase().replace(/\s+/g, '-');
    const modelSlug = page.model.toLowerCase().replace(/\s+/g, '-');
    const toolLabel = TOOL_TYPE_META[page.toolType]?.label || 'Guide';
    const vehicleName = `${page.make} ${page.model}`;
    const manualCitationGroups = await getToolManualCitationGroups(page);
    const verificationNote = getToolVerificationNote(page.toolType);
    const makeManualHref = `/manual/${encodeURIComponent(page.make)}`;
    const manualNavigatorHref = '/manual-navigator';

    const sameVehicleTools = getToolPagesForVehicle(page.make, page.model, page.slug).slice(0, 6);
    const sameTypeTools = getToolPagesForType(page.toolType, page.slug)
        .filter((tp) => !(tp.make === page.make && tp.model === page.model))
        .slice(0, 9);
    const repairLinks = getRelatedRepairLinks(page, 4);
    const primaryRepairTask = repairLinks[0]?.task ?? 'oil-change';

    const meta = TOOL_TYPE_META[page.toolType] || { label: 'Guide', icon: '🔧', color: 'cyan' };
    const colorMap: Record<string, string> = {
        amber: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
        green: 'text-green-400 border-green-500/30 bg-green-500/5',
        blue: 'text-blue-400 border-blue-500/30 bg-blue-500/5',
        purple: 'text-purple-400 border-purple-500/30 bg-purple-500/5',
        yellow: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5',
        cyan: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5',
        orange: 'text-orange-400 border-orange-500/30 bg-orange-500/5',
        sky: 'text-sky-400 border-sky-500/30 bg-sky-500/5',
        teal: 'text-teal-400 border-teal-500/30 bg-teal-500/5',
        rose: 'text-rose-400 border-rose-500/30 bg-rose-500/5',
    };
    const colorClasses = colorMap[meta.color] || colorMap.cyan;

    // Schema.org FAQPage structured data
    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: page.faq.map(f => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
    };

    // Amazon search links
    const amazonSearch = (query: string) => buildAmazonSearchUrl(query, 'automotive', 'tool-dynamic');

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "BreadcrumbList",
                    itemListElement: [
                        { "@type": "ListItem", position: 1, name: "Guides", item: "https://spotonauto.com/guides" },
                        { "@type": "ListItem", position: 2, name: page.make, item: `https://spotonauto.com/guides/${page.make.toLowerCase()}` },
                        { "@type": "ListItem", position: 3, name: `${page.make} ${page.model} ${meta.label}`, item: `https://spotonauto.com/tools/${page.slug}` },
                    ],
                }) }}
            />

            {/* Hero */}
            <section className="py-16 px-4 max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6 text-sm font-semibold uppercase tracking-wider ${colorClasses}`}>
                        <span>{meta.icon}</span>
                        <span className={colorClasses.split(' ')[0]}>{meta.label}</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        {page.make} {page.model} <span className="text-cyan-400">{meta.label}</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        {page.description}
                    </p>
                </div>

                <ToolManualConfirmation
                    vehicleName={vehicleName}
                    modelName={page.model}
                    toolLabel={toolLabel}
                    quickAnswer={page.quickAnswer}
                    verificationNote={verificationNote}
                    manualNavigatorHref={manualNavigatorHref}
                    makeManualHref={makeManualHref}
                    citationGroups={manualCitationGroups}
                />

                {/* Generation Breakdown */}
                <div className="space-y-8 mb-12">
                    {page.generations.map((gen, i) => (
                        <div key={i} className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
                            <div className="bg-white/[0.05] px-6 py-4 border-b border-white/10 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white">{gen.name}</h2>
                                <span className="text-sm text-gray-400 font-mono">{gen.years}</span>
                            </div>
                            <div className="p-6">
                                {/* Specs Table */}
                                <div className="grid gap-3 mb-4">
                                    {Object.entries(gen.specs).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                            <span className="text-gray-400 text-sm">{key}</span>
                                            <span className="text-white font-semibold text-sm font-mono">{value}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Generation Notes */}
                                {gen.notes && gen.notes.length > 0 && (
                                    <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                                        <span className="text-xs uppercase tracking-wider text-amber-400 font-bold">Notes</span>
                                        <ul className="mt-2 space-y-1">
                                            {gen.notes.map((note, ni) => (
                                                <li key={ni} className="text-amber-200/80 text-sm flex items-start gap-2">
                                                    <span className="text-amber-400 mt-0.5">→</span>
                                                    {note}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Shop CTA */}
                                <div className="mt-4 flex flex-wrap gap-3">
                                    <AffiliateLink
                                        href={amazonSearch(`${page.make} ${page.model} ${gen.years.split('-')[0]} ${meta.label.toLowerCase()}`)}
                                        partName={`${page.make} ${page.model} ${meta.label}`}
                                        vehicle={vehicleName}
                                        pageType="parts_page"
                                        subtag={`tool-spec-${page.toolType}`}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-black text-sm font-bold rounded-lg hover:bg-amber-400 transition"
                                    >
                                        Shop on Amazon →
                                    </AffiliateLink>
                                    <Link
                                        href={`/repair/${gen.years.split('-')[0]}/${makeSlug}/${modelSlug}/${primaryRepairTask}`}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 text-cyan-400 text-sm font-semibold rounded-lg border border-cyan-500/30 hover:bg-cyan-500/20 transition"
                                    >
                                        Full Repair Guide →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <ToolIntentCommerce page={page} />

                {/* Suggested Supplies */}
                <MaintenanceSupplies
                    toolType={page.toolType}
                    make={page.make}
                    model={page.model}
                />

                {/* Ad: After Generation Breakdown */}
                <AdUnit slot="tool-after-specs" />

                {/* FAQ Section */}
                <section className="mb-12 max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
                    <dl className="space-y-4">
                        {page.faq.map((f, i) => (
                            <div key={i} className="bg-white/[0.03] rounded-xl border border-white/10 overflow-hidden">
                                <dt className="px-5 py-4 font-semibold text-white">{f.q}</dt>
                                <dd className="px-5 pb-4 text-gray-400 text-sm leading-relaxed">{f.a}</dd>
                            </div>
                        ))}
                    </dl>
                </section>

                {/* Ad: After FAQ */}
                <AdUnit slot="tool-after-faq" format="horizontal" />

                {/* Repair Task Cluster — strengthens internal links to high-intent repair pages */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold text-white mb-6">
                        {page.make} {page.model} Repair Guides
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {repairLinks.map((link) => (
                            <Link
                                key={link.task}
                                href={link.href}
                                className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 transition group"
                            >
                                <span className="text-cyan-400">→</span>
                                <span className="text-gray-300 text-sm group-hover:text-white transition">
                                    {page.make} {page.model} {link.label}
                                </span>
                            </Link>
                        ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm">
                        <Link href={`/guides/${makeSlug}`} className="text-cyan-400 hover:underline">
                            Browse all {page.make} guides →
                        </Link>
                        <Link href={`/guides/${makeSlug}/${modelSlug}`} className="text-cyan-400 hover:underline">
                            Browse all {page.make} {page.model} guides →
                        </Link>
                    </div>
                </section>

                {/* Related Tools */}
                <section className="mb-12">
                    <div className="flex items-center justify-between gap-4 mb-6">
                        <h2 className="text-xl font-bold text-white">
                            More {page.make} {page.model} Guides
                        </h2>
                        <Link href={`/tools/type/${page.toolType}`} className="text-sm text-cyan-400 hover:underline">
                            Browse all {meta.label} pages →
                        </Link>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {sameVehicleTools.map(tp => (
                                <Link
                                    key={tp.slug}
                                    href={`/tools/${tp.slug}`}
                                    className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 transition group"
                                >
                                    <span className="text-lg">{TOOL_TYPE_META[tp.toolType]?.icon || '🔧'}</span>
                                    <span className="text-gray-300 text-sm group-hover:text-white transition">{tp.make} {tp.model} {TOOL_TYPE_META[tp.toolType]?.label}</span>
                                </Link>
                            ))
                        }
                        {sameTypeTools.map(tp => (
                                <Link
                                    key={tp.slug}
                                    href={`/tools/${tp.slug}`}
                                    className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 transition group"
                                >
                                    <span className="text-lg">{TOOL_TYPE_META[tp.toolType]?.icon || '🔧'}</span>
                                    <span className="text-gray-300 text-sm group-hover:text-white transition">{tp.make} {tp.model} {TOOL_TYPE_META[tp.toolType]?.label}</span>
                                </Link>
                            ))
                        }
                    </div>
                </section>

                {/* Bottom CTA */}
                <div className="text-center py-8 border-t border-white/10">
                    <p className="text-gray-400 mb-4">Need a full step-by-step repair guide?</p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition text-lg"
                    >
                        Start Free AI Diagnosis →
                    </Link>
                    <p className="text-gray-600 text-sm mt-3">100% Free — No signup required</p>
                </div>
            </section>
        </div>
    );
}
