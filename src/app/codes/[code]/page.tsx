import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DTC_CODES, DTC_CODES_MAP } from '@/data/dtc-codes-data';
import CodePageClient from './CodePageClient';
import { getManualSectionLinksForCode } from '@/lib/manualSectionLinks';
import { getDtcCrossVehicleSummary } from '@/lib/dtcCrossVehicle';
import { getDTCGraphData } from '@/lib/graphQueries';

interface PageProps {
    params: Promise<{ code: string }>;
}

export const revalidate = 21600; // 6 hour ISR

/** Pre-render top 50 codes at build time. Rest use ISR. */
export async function generateStaticParams() {
    return DTC_CODES.slice(0, 50).map(c => ({ code: c.code.toLowerCase() }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { code: slug } = await params;
    const dtc = DTC_CODES_MAP.get(slug.toUpperCase());
    if (!dtc) return { title: 'Code Not Found' };
    const pageUrl = `https://spotonauto.com/codes/${dtc.code.toLowerCase()}`;

    let oemMeta: Awaited<ReturnType<typeof getDtcCrossVehicleSummary>> = null;
    try {
        oemMeta = await getDtcCrossVehicleSummary(dtc.code);
    } catch (error) {
        console.warn(`[codes] cross-vehicle metadata unavailable for ${dtc.code}`, error);
    }
    const oemSuffix = oemMeta && oemMeta.n > 0
        ? ` Covers ${oemMeta.n}+ vehicles.`
        : '';
    const title = `${dtc.code}: ${dtc.title} — Causes & Fix | SpotOnAuto`;
    const description = `What is ${dtc.code}? ${dtc.title} — ${dtc.severity} severity, likely causes, symptom clues, and typical fix cost: ${dtc.estimatedCostRange}.${oemSuffix} Free step-by-step diagnosis and repair guide.`;

    return {
        title,
        description,
        keywords: [
            dtc.code, `${dtc.code} code`, `what does ${dtc.code} mean`,
            `${dtc.code} fix`, `${dtc.code} symptoms`, dtc.title,
        ],
        openGraph: {
            title,
            description,
            type: 'article',
            url: pageUrl,
        },
        twitter: { card: 'summary', title, description },
        alternates: {
            canonical: pageUrl,
        },
    };
}

export default async function CodePage({ params }: PageProps) {
    const { code: slug } = await params;
    const dtc = DTC_CODES_MAP.get(slug.toUpperCase());
    if (!dtc) notFound();
    let manualLinks: Awaited<ReturnType<typeof getManualSectionLinksForCode>> = [];
    try {
        manualLinks = await getManualSectionLinksForCode(dtc, 4);
    } catch (error) {
        console.warn(`[codes] manual links unavailable for ${dtc.code}`, error);
    }

    let graphData: Awaited<ReturnType<typeof getDTCGraphData>> = null;
    try {
        graphData = await getDTCGraphData(dtc.code, 8);
    } catch (error) {
        console.warn(`[codes] graph data unavailable for ${dtc.code}`, error);
    }
    const pageUrl = `https://spotonauto.com/codes/${dtc.code.toLowerCase()}`;
    const schemaDate = '2026-03-05';
    const schemaAuthor = {
        '@type': 'Organization',
        name: 'SpotOnAuto Editorial Team',
        url: 'https://spotonauto.com',
    };

    const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `${dtc.code}: ${dtc.title}`,
        description: `${dtc.code} means ${dtc.title}. ${dtc.description} Common fix: ${dtc.commonFix}. Estimated cost: ${dtc.estimatedCostRange}.`,
        author: schemaAuthor,
        publisher: schemaAuthor,
        datePublished: schemaDate,
        dateModified: schemaDate,
        mainEntityOfPage: pageUrl,
        url: pageUrl,
    };

    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: dtc.faq.map(f => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
    };

    const howToSchema = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: `How to diagnose ${dtc.code}`,
        description: `Step-by-step process to diagnose ${dtc.code} (${dtc.title}) before replacing parts.`,
        image: 'https://spotonauto.com/og-default.svg',
        totalTime: 'PT1H',
        estimatedCost: {
            '@type': 'MonetaryAmount',
            currency: 'USD',
            value: '20-500',
        },
        supply: [
            { '@type': 'HowToSupply', name: 'Replacement parts as confirmed by test results' },
        ],
        tool: [
            { '@type': 'HowToTool', name: 'OBD2 scan tool' },
            { '@type': 'HowToTool', name: 'Digital multimeter' },
        ],
        step: dtc.diagnosticSteps.map((step, index) => ({
            '@type': 'HowToStep',
            name: `Step ${index + 1}`,
            text: step,
            url: `${pageUrl}#diagnose-steps`,
            image: 'https://spotonauto.com/og-default.svg',
        })),
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
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
                        { "@type": "ListItem", position: 1, name: "DTC Codes", item: "https://spotonauto.com/codes" },
                        { "@type": "ListItem", position: 2, name: `${dtc.code}: ${dtc.title}`, item: `https://spotonauto.com/codes/${dtc.code.toLowerCase()}` },
                    ],
                }) }}
            />
            <CodePageClient code={dtc} manualLinks={manualLinks} graphData={graphData} />
        </div>
    );
}
