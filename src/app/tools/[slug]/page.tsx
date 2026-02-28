import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { TOOL_PAGES, getToolPage, TOOL_TYPE_META } from '@/data/tools-pages';

interface PageProps {
    params: Promise<{ slug: string }>;
}

/**
 * Pre-render the top ~200 pages at build time (highest search volume).
 * The remaining ~1,600 pages are ISR — rendered on first visit, then cached.
 * dynamicParams defaults to true, so non-pre-rendered slugs still work.
 */
const TOP_MAKES = new Set([
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai',
    'Kia', 'Jeep', 'Subaru', 'BMW', 'Dodge', 'GMC', 'Mazda',
    'Volkswagen', 'Lexus', 'Mercedes',
]);

export async function generateStaticParams() {
    return TOOL_PAGES
        .filter(tp => TOP_MAKES.has(tp.make))
        .map(tp => ({ slug: tp.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const page = getToolPage(slug);
    if (!page) return { title: 'Tool Not Found' };

    return {
        title: page.title,
        description: page.description,
        keywords: page.keywords,
        openGraph: {
            title: page.title,
            description: page.description,
            type: 'article',
            url: `https://spotonauto.com/tools/${page.slug}`,
        },
        twitter: {
            card: 'summary',
            title: page.title,
            description: page.description,
        },
        alternates: {
            canonical: `https://spotonauto.com/tools/${page.slug}`,
        },
    };
}

const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'antigravity-20';

export default async function ToolPage({ params }: PageProps) {
    const { slug } = await params;
    const page = getToolPage(slug);
    if (!page) notFound();

    const meta = TOOL_TYPE_META[page.toolType] || { label: 'Guide', icon: '🔧', color: 'cyan' };
    const colorMap: Record<string, string> = {
        amber: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
        green: 'text-green-400 border-green-500/30 bg-green-500/5',
        blue: 'text-blue-400 border-blue-500/30 bg-blue-500/5',
        purple: 'text-purple-400 border-purple-500/30 bg-purple-500/5',
        yellow: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5',
        cyan: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5',
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
    const amazonSearch = (query: string) =>
        `https://www.amazon.com/s?k=${encodeURIComponent(query)}&i=automotive&tag=${AMAZON_TAG}`;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />

            {/* Hero */}
            <section className="py-16 px-4 max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6 text-sm font-semibold uppercase tracking-wider ${colorClasses}">
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

                {/* Quick Answer Box — targets featured snippets */}
                <div className="mb-12 bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-6 max-w-3xl mx-auto">
                    <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-2">Quick Answer</h2>
                    <p className="text-white text-lg leading-relaxed">{page.quickAnswer}</p>
                </div>

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
                                    <a
                                        href={amazonSearch(`${page.make} ${page.model} ${gen.years.split('-')[0]} ${meta.label.toLowerCase()}`)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-black text-sm font-bold rounded-lg hover:bg-amber-400 transition"
                                    >
                                        Shop on Amazon →
                                    </a>
                                    <Link
                                        href={`/repair/${gen.years.split('-')[0]}/${page.make.toLowerCase().replace(/\s+/g, '-')}/${page.model.toLowerCase().replace(/\s+/g, '-')}/${page.toolType === 'oil-type' ? 'oil-change' : page.toolType === 'battery-location' ? 'battery-replacement' : page.toolType === 'tire-size' ? 'wheel-bearing-replacement' : page.toolType === 'serpentine-belt' ? 'serpentine-belt-replacement' : 'brake-pad-replacement'}`}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 text-cyan-400 text-sm font-semibold rounded-lg border border-cyan-500/30 hover:bg-cyan-500/20 transition"
                                    >
                                        Full Repair Guide →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

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

                {/* Related Tools */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold text-white mb-6">
                        More {page.make} {page.model} Guides
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {TOOL_PAGES
                            .filter(tp => tp.slug !== page.slug && (tp.make === page.make && tp.model === page.model))
                            .slice(0, 3)
                            .map(tp => (
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
                        {TOOL_PAGES
                            .filter(tp => tp.slug !== page.slug && tp.toolType === page.toolType && tp.make !== page.make)
                            .slice(0, 6)
                            .map(tp => (
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
