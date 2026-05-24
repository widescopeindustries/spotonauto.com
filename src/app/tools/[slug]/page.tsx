import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
    getHighPriorityToolPages,
    TOOL_TYPE_META,
    getToolPagesForType,
    getToolPagesForVehicle,
    getRelatedRepairLinks,
    getConciseQuickAnswer,
} from '@/data/tools-pages';
import { getToolPageAsync, type ToolPageResult } from '@/lib/dynamicToolPage';
import AdUnit from '@/components/AdUnit';
import ToolManualConfirmation from '@/components/ToolManualConfirmation';
import MaintenanceSupplies from '@/components/MaintenanceSupplies';
import ManualPartsList from '@/components/ManualPartsList';
import KitCTA from '@/components/KitCTA';
import ToolIntentCommerce from '@/components/ToolIntentCommerce';
import AffiliateLink from '@/components/AffiliateLink';
import ConversionZone from '@/components/ConversionZone';
import AuthorBioCard from '@/components/AuthorBioCard';
import LlmExtractionBox from '@/components/LlmExtractionBox';
import { buildAmazonSearchUrl } from '@/lib/amazonAffiliate';
import { getAmazonCtaLabel, getAmazonCtaVariantForSlug } from '@/lib/abTests';
import { getToolManualCitationGroups, getToolVerificationNote } from '@/lib/toolManualCitations';
import type { ToolPage } from '@/data/tools-pages';

interface PageProps {
    params: Promise<{ slug: string }>;
}

/** Extract a spec value by fuzzy keyword matching across generations */
function findSpec(page: ToolPage, keywords: string[]): string | undefined {
    for (const gen of page.generations) {
        for (const [key, value] of Object.entries(gen.specs)) {
            const lowerKey = key.toLowerCase();
            if (keywords.some(k => lowerKey.includes(k.toLowerCase()))) {
                return `${value} (${gen.years})`;
            }
        }
    }
    return undefined;
}

/** Auto-generate relevant FAQs from page data so every tool page has unique, useful Q&A */
function buildToolFaqs(page: ToolPage): Array<{ q: string; a: string }> {
    const { make, model, toolType, quickAnswer, generations } = page;
    const vehicle = `${make} ${model}`;
    const typeLabel = (TOOL_TYPE_META[toolType]?.label || 'spec').toLowerCase();
    const faqs = [...page.faq];

    // Primary question — always add if we have a quick answer
    if (quickAnswer) {
        faqs.push({ q: `What ${typeLabel} does a ${vehicle} use?`, a: quickAnswer });
    }

    // Tool-type-specific secondary questions
    if (toolType === 'oil-type') {
        const capacity = findSpec(page, ['capacity', 'quart', 'qts', 'qt.', 'liters', 'l ']);
        if (capacity) faqs.push({ q: `How much oil does a ${vehicle} take?`, a: capacity });
        faqs.push({
            q: `How often should I change the oil in a ${vehicle}?`,
            a: `Most ${make} service manuals recommend oil changes every 5,000–7,500 miles under normal driving conditions. Severe conditions (towing, extreme temperatures, stop-and-go traffic) may require more frequent changes. Verify with your owner's manual for the exact interval.`,
        });
    } else if (toolType === 'coolant-type') {
        faqs.push({
            q: `Can I use universal coolant in a ${vehicle}?`,
            a: `Factory manuals specify exact coolant chemistry for the ${vehicle}. Using the wrong coolant type can cause corrosion, overheating, or gasket damage. Always match the OEM specification exactly — do not mix incompatible coolant types.`,
        });
    } else if (toolType === 'transmission-fluid-type') {
        const capacity = findSpec(page, ['capacity', 'total', 'refill', 'quart', 'qts']);
        if (capacity) faqs.push({ q: `How much transmission fluid does a ${vehicle} hold?`, a: capacity });
        faqs.push({
            q: `When should I change the transmission fluid in a ${vehicle}?`,
            a: `Factory service manuals typically recommend transmission fluid changes every 30,000–60,000 miles for automatics and 60,000–100,000 miles for manuals under normal use. Severe service intervals are shorter. Check your maintenance schedule for the exact mileage.`,
        });
    } else if (toolType === 'tire-size') {
        const pressure = findSpec(page, ['pressure', 'psi', 'cold', 'front', 'rear']);
        if (pressure) faqs.push({ q: `What tire pressure for a ${vehicle}?`, a: pressure });
        faqs.push({
            q: `Can I use a different tire size on my ${vehicle}?`,
            a: `Deviating from the factory tire size changes speedometer accuracy, handling, and load capacity. If you change sizes, ensure the overall diameter stays within 3% of OEM and the load/speed ratings meet or exceed factory specs.`,
        });
    } else if (toolType === 'spark-plug-type') {
        const gap = findSpec(page, ['gap', 'mm', 'inch']);
        if (gap) faqs.push({ q: `What is the spark plug gap for a ${vehicle}?`, a: gap });
        faqs.push({
            q: `How often to replace spark plugs on a ${vehicle}?`,
            a: `Factory service manuals typically recommend spark plug replacement every 30,000–100,000 miles depending on plug material (copper, platinum, or iridium). Check your maintenance schedule for the exact interval.`,
        });
    } else if (toolType === 'battery-location') {
        faqs.push({
            q: `What battery size for a ${vehicle}?`,
            a: quickAnswer || `Check the factory manual for exact group size, CCA rating, and terminal orientation for your ${vehicle}. Using the wrong size can cause fitment issues or electrical problems.`,
        });
    } else if (toolType === 'wiper-blade-size') {
        faqs.push({
            q: `Are wiper blades the same size on both sides of a ${vehicle}?`,
            a: `No. Most vehicles use different lengths for the driver and passenger sides. Some also have a separate rear wiper. The factory manual lists exact sizes for each position — do not assume symmetry.`,
        });
    } else if (toolType === 'headlight-bulb') {
        faqs.push({
            q: `Low beam vs high beam bulb for ${vehicle}?`,
            a: `Many vehicles use separate bulbs for low and high beams, while others use a single dual-filament bulb. Check the generation breakdown above for the exact bulb type assigned to each function.`,
        });
    } else if (toolType === 'serpentine-belt') {
        faqs.push({
            q: `How do I know if my ${vehicle} serpentine belt is bad?`,
            a: `Common signs include squealing on startup (especially when cold), visible cracks or fraying on the ribbed side, power steering or A/C failure, and battery warning lights. The factory manual includes inspection criteria and replacement intervals.`,
        });
    } else if (toolType === 'fluid-capacity') {
        faqs.push({
            q: `Why do fluid capacities vary by generation for the ${vehicle}?`,
            a: `Different engine options, transmission types, and cooling system designs across model years change total fluid volumes. Always use the capacity listed for your exact year and engine code — do not guess across generations.`,
        });
    }

    return faqs.slice(0, 5);
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

// Explicitly allow on-demand generation for slugs not in generateStaticParams.
// Next.js default is true, but we set it explicitly to guard against stale
// build artifacts or edge-case caching that can block corpus-backed pages.
export const dynamicParams = true;

export async function generateStaticParams() {
    return getHighPriorityToolPages(TOOL_PREBUILD_LIMIT).map((tp) => ({ slug: tp.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const result = await getToolPageAsync(slug);
    if (!result) return { title: 'Tool Not Found' };
    const { page, quality } = result;

    // CTR-optimized title: use the concise spec (e.g. "0W-20 Oil") from the
    // newest generation so the title stays under ~70 chars and the answer is
    // visible in the SERP.
    let baseTitle = page.title.replace(/\s*\|\s*AllOEMManuals$/, '').replace(/\s*\|\s*All Years Guide$/, '');
    // Strip verbose suffixes that eat title space without adding click value
    baseTitle = baseTitle
        .replace(/\s+Location by Year$/i, '')
        .replace(/\s+Type & Capacity$/i, '')
        .replace(/\s+by Year$/i, '')
        .replace(/\s+Type$/i, '');

    // Pick the newest generation year for a concise spec extraction
    const newestGen = page.generations[0];
    const newestYear = newestGen
        ? parseInt(newestGen.years.split('-').pop()?.trim() || '2020', 10)
        : 2020;
    const conciseSpec = getConciseQuickAnswer(newestYear, page);

    function trunc(s: string, n: number): string {
        return s.length > n ? s.slice(0, n - 1) + '…' : s;
    }

    let title: string;
    if (conciseSpec) {
        const shortBase = trunc(baseTitle, 28);
        const shortSpec = trunc(conciseSpec, 26);
        const candidate = `${shortBase}: ${shortSpec} | AllOEMManuals`;
        title = candidate.length <= 70 ? candidate : `${shortBase} | AllOEMManuals`;
    } else {
        title = `${trunc(baseTitle, 50)} | AllOEMManuals`;
    }

    // Lead description with the quick answer so actual specs appear in SERP snippet
    const baseDescription = page.description.replace(/\s+/g, ' ').trim();
    const answerText = page.quickAnswer ? page.quickAnswer.replace(/\s+/g, ' ').trim().replace(/\.$/, '') : '';
    const supportText = 'Use the exact vehicle page to confirm fitment, compare related repair paths, and build the one-trip parts list before you start.';
    const description = [baseDescription, answerText, supportText].filter(Boolean).join(' ');

    // Keep generic tool pages indexed — they aggregate all years and maintain AI citation equity.
    // Vehicle-specific maintenance pages coexist and rank for year-specific queries.
    return {
        title,
        description,
        keywords: page.keywords,
        openGraph: {
            title,
            description,
            type: 'article',
            url: `https://alloemmanuals.com/tools/${page.slug}`,
        },
        twitter: {
            card: 'summary',
            title,
            description,
        },
        alternates: {
            canonical: `https://alloemmanuals.com/tools/${page.slug}`,
        },
    };
}

export default async function ToolPage({ params }: PageProps) {
    const { slug } = await params;
    const result = await getToolPageAsync(slug);
    if (!result) notFound();
    const { page, quality } = result;
    const amazonCtaVariant = getAmazonCtaVariantForSlug(slug);

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

    // Maintenance hub link — pick a representative year from the newest generation
    const newestGen = page.generations[0];
    const maintYear = newestGen ? parseInt(newestGen.years.split('-')[0], 10) : 2020;
    const maintenanceHubHref = `/maintenance/${maintYear}/${makeSlug}/${modelSlug}`;

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

    const schemaDate = new Date().toISOString().slice(0, 10);
    const pageUrl = `https://alloemmanuals.com/tools/${page.slug}`;

    // Schema.org FAQPage structured data — auto-generated per page for unique, relevant Q&A
    const pageFaqs = buildToolFaqs(page);
    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: pageFaqs.map(f => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
    };

    const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: page.title,
        description: page.description,
        datePublished: schemaDate,
        dateModified: schemaDate,
        author: {
            '@type': 'Person',
            name: 'AllOEMManuals Editorial Team',
            jobTitle: 'ASE-Certified Technical Review Team',
        },
        publisher: {
            '@type': 'Organization',
            name: 'AllOEMManuals',
            logo: {
                '@type': 'ImageObject',
                url: 'https://alloemmanuals.com/logo.png',
            },
        },
    };

    const howToSchema = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: `${page.make} ${page.model} ${toolLabel}: verify and service`,
        description: page.description,
        image: 'https://alloemmanuals.com/og-default.svg',
        totalTime: 'PT45M',
        estimatedCost: {
            '@type': 'MonetaryAmount',
            currency: 'USD',
            minValue: 30,
            maxValue: 180,
        },
        supply: [
            { '@type': 'HowToSupply', name: `${page.make} ${page.model} replacement fluid or part` },
            { '@type': 'HowToSupply', name: 'Shop towels and gloves' },
        ],
        tool: [
            { '@type': 'HowToTool', name: 'Torque wrench' },
            { '@type': 'HowToTool', name: 'OBD2 scanner (optional verification)' },
        ],
        step: page.generations.slice(0, 6).map((gen, idx) => ({
            '@type': 'HowToStep',
            name: `Check specs for ${gen.name}`,
            text: `Confirm ${gen.name} (${gen.years}) values before buying parts. Key specs: ${Object.entries(gen.specs).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(', ')}.`,
            url: `${pageUrl}#specs`,
            image: 'https://alloemmanuals.com/og-default.svg',
            position: idx + 1,
        })),
    };

    // Build specs record for the LLM extraction box
    const llmSpecs: Record<string, string> = {};
    if (page.quickAnswer) {
        llmSpecs['Quick Answer'] = page.quickAnswer;
    }
    page.generations.forEach((gen) => {
        Object.entries(gen.specs).forEach(([key, value]) => {
            const cleanKey = `${key} (${gen.years})`;
            llmSpecs[cleanKey] = String(value);
        });
    });

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
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "BreadcrumbList",
                    itemListElement: [
                        { "@type": "ListItem", position: 1, name: "Guides", item: "https://alloemmanuals.com/guides" },
                        { "@type": "ListItem", position: 2, name: page.make, item: `https://alloemmanuals.com/guides/${page.make.toLowerCase()}` },
                        { "@type": "ListItem", position: 3, name: `${page.make} ${page.model} ${meta.label}`, item: `https://alloemmanuals.com/tools/${page.slug}` },
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
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-gray-500">
                        Last updated: {schemaDate} • Reading time: 8 min • By AllOEMManuals Editorial Team
                    </p>
                </div>

                {page.isDynamic && (
                    <div className="mb-8 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
                        <span className="text-amber-400 text-lg mt-0.5">⚡</span>
                        <div>
                            <p className="text-amber-200 text-sm font-medium">Factory Manual Data — Live Extraction</p>
                            <p className="text-amber-200/70 text-xs mt-1">
                                This page was generated on-demand from our 1.1TB service manual archive.
                                Structured specs are being verified. Always cross-check with your factory manual before ordering parts.
                            </p>
                        </div>
                    </div>
                )}

                <div className="answer-box">
                    <h2>Quick Answer</h2>
                    <p className="primary-answer">{page.quickAnswer}</p>
                    <div className="spec-table-wrap">
                        <table className="spec-table">
                            <thead>
                                <tr>
                                    <th>Generation</th>
                                    <th>Years</th>
                                    <th>Top spec</th>
                                </tr>
                            </thead>
                            <tbody>
                                {page.generations.slice(0, 3).map((gen) => (
                                    <tr key={gen.name}>
                                        <td>{gen.name}</td>
                                        <td>{gen.years}</td>
                                        <td>{Object.entries(gen.specs)[0]?.[1] ?? 'See full chart below'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <LlmExtractionBox
                    title={`${page.make} ${page.model} ${toolLabel}`}
                    data={llmSpecs}
                    className="mb-8"
                />

                {/* Kit CTA Integration */}
                {(page.toolType === 'oil-type' || page.toolType === 'fluid-capacity') && (
                    <KitCTA make={page.make} model={page.model} />
                )}

                {/* Factory Specs CTA — drives internal link equity to maintenance hubs */}
                <div className="mb-8 rounded-xl border border-teal-500/20 bg-teal-500/5 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h3 className="text-teal-300 font-semibold text-sm uppercase tracking-wider mb-1">Factory Manual Verification</h3>
                        <p className="text-gray-400 text-sm">
                            Cross-check these specs against the official {page.make} {page.model} maintenance schedule.
                        </p>
                    </div>
                    <Link
                        href={maintenanceHubHref}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-500 text-black text-sm font-bold rounded-lg hover:bg-teal-400 transition shrink-0"
                    >
                        View Factory Specs →
                    </Link>
                </div>

                <nav className="mb-8 flex flex-wrap gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
                    <a href="#specs" className="text-cyan-300 hover:text-cyan-200">Step-by-Step Specs</a>
                    <a href="#faq" className="text-cyan-300 hover:text-cyan-200">Common Questions</a>
                    <a href="#related-repairs" className="text-cyan-300 hover:text-cyan-200">Related Repairs</a>
                    <a href="#related-tools" className="text-cyan-300 hover:text-cyan-200">Related Guides</a>
                </nav>

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
                <div id="specs" className="space-y-8 mb-12">
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
                                        <div key={key} className="flex flex-col gap-1 py-2 border-b border-white/5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
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
                                        subtag={`tool-spec-${page.toolType}-v${amazonCtaVariant}`}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-black text-sm font-bold rounded-lg hover:bg-amber-400 transition"
                                    >
                                        {getAmazonCtaLabel(amazonCtaVariant)} →
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

                {page.toolType === 'oil-type' && (
                    <KitCTA make={page.make} model={page.model} />
                )}

                <ToolIntentCommerce page={page} ctaVariant={amazonCtaVariant} />

                <ManualPartsList page={page} ctaVariant={amazonCtaVariant} />

                {/* Suggested Supplies */}
                <MaintenanceSupplies
                    toolType={page.toolType}
                    make={page.make}
                    model={page.model}
                    specHint={page.generations[0] ? Object.values(page.generations[0].specs)[0] : undefined}
                />

                {/* Ad: After Generation Breakdown */}
                <AdUnit slot="tool-after-specs" />

                {/* FAQ Section */}
                <section id="faq" className="mb-12 max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
                    <dl className="space-y-4">
                        {pageFaqs.map((f, i) => (
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
                <section id="related-repairs" className="mb-12">
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
                <section id="related-tools" className="mb-12">
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

                <ConversionZone
                    vehicleLabel={`${page.make} ${page.model}`}
                    intentLabel={`${page.make} ${page.model} ${toolLabel}`}
                />

                <AuthorBioCard updatedDate={schemaDate} />

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
