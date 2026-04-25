import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getToolPagesForType, TOOL_TYPE_META, type ToolType } from '@/data/tools-pages';

export const revalidate = 86400; // 1 day ISR

interface PageProps {
    params: Promise<{ toolType: string }>;
}

const TOOL_TYPES = Object.keys(TOOL_TYPE_META);

function titleCase(s: string): string {
    return s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateStaticParams() {
    return TOOL_TYPES.map((toolType) => ({ toolType }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { toolType } = await params;
    const meta = TOOL_TYPE_META[toolType];
    if (!meta) {
        return { title: 'Tool Type Not Found | SpotOnAuto' };
    }

    return {
        title: `${meta.label} Guides | SpotOnAuto`,
        description: `Open every ${meta.label.toLowerCase()} page by make and model. Find vehicle-specific specs, exact-fit repair links, and a faster one-trip shopping path for the job you are researching.`,
        alternates: {
            canonical: `https://spotonauto.com/tools/type/${toolType}`,
        },
    };
}

export default async function ToolTypeHubPage({ params }: PageProps) {
    const { toolType } = await params;
    const meta = TOOL_TYPE_META[toolType];
    if (!meta) notFound();

    const pages = getToolPagesForType(toolType as ToolType);
    const byMake = new Map<string, typeof pages>();
    for (const page of pages) {
        if (!byMake.has(page.make)) byMake.set(page.make, []);
        byMake.get(page.make)!.push(page);
    }

    const grouped = Array.from(byMake.entries())
        .map(([make, toolPages]) => [make, [...toolPages].sort((a, b) => a.model.localeCompare(b.model))] as const);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            <section className="py-14 px-4 max-w-7xl mx-auto">
                <Link href="/tools" className="text-cyan-400 hover:underline text-sm">
                    ← Back to Tools
                </Link>

                <header className="mt-6 mb-10">
                    <p className="text-sm uppercase tracking-widest text-cyan-400 mb-2">
                        {meta.icon} {titleCase(toolType)}
                    </p>
                    <h1 className="text-4xl md:text-5xl font-bold">
                        {meta.label} Guides
                    </h1>
                    <p className="text-gray-400 mt-3 max-w-2xl">
                        Browse {pages.length} indexable pages grouped by make. Use this hub to jump to exact
                        model-level specs and related repair guides.
                    </p>
                </header>

                <div className="space-y-8">
                    {grouped.map(([make, toolPages]) => (
                        <section key={make} className="bg-white/[0.03] border border-white/10 rounded-xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4">{make}</h2>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {toolPages.map((page) => (
                                    <Link
                                        key={page.slug}
                                        href={`/tools/${page.slug}`}
                                        className="block p-4 rounded-lg bg-white/[0.04] border border-white/10 hover:border-cyan-500/40 transition group"
                                    >
                                        <h3 className="text-sm font-semibold text-gray-200 group-hover:text-white transition">
                                            {page.make} {page.model}
                                        </h3>
                                        <p className="text-xs text-cyan-400 mt-1">{meta.label} →</p>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </section>
        </div>
    );
}
