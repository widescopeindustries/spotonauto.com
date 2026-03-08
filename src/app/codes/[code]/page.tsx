import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DTC_CODES, DTC_CODES_MAP } from '@/data/dtc-codes-data';
import CodePageClient from './CodePageClient';
import { getManualSectionLinksForCode } from '@/lib/manualSectionLinks';

interface PageProps {
    params: Promise<{ code: string }>;
}

/** Pre-render top 50 codes at build time. Rest use ISR. */
export async function generateStaticParams() {
    return DTC_CODES.slice(0, 50).map(c => ({ code: c.code.toLowerCase() }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { code: slug } = await params;
    const dtc = DTC_CODES_MAP.get(slug.toUpperCase());
    if (!dtc) return { title: 'Code Not Found' };
    const pageUrl = `https://spotonauto.com/codes/${dtc.code.toLowerCase()}`;

    const title = `${dtc.code}: ${dtc.title} — Symptoms, Causes & Fix | SpotOn Auto`;
    const description = `${dtc.code} means ${dtc.title}. ${dtc.description} Estimated fix cost: ${dtc.estimatedCostRange}. Free diagnosis and repair guide.`;

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
    const manualLinks = await getManualSectionLinksForCode(dtc, 4);
    const pageUrl = `https://spotonauto.com/codes/${dtc.code.toLowerCase()}`;
    const schemaDate = '2026-03-05';
    const schemaAuthor = {
        '@type': 'Organization',
        name: 'SpotOnAuto Editorial Team',
        url: 'https://spotonauto.com',
    };

    // QAPage + FAQPage structured data
    const qaSchema = {
        '@context': 'https://schema.org',
        '@type': 'QAPage',
        mainEntity: {
            '@type': 'Question',
            name: `What does ${dtc.code} mean?`,
            text: `${dtc.code} — ${dtc.title}. ${dtc.description}`,
            author: schemaAuthor,
            datePublished: schemaDate,
            answerCount: 1,
            acceptedAnswer: {
                '@type': 'Answer',
                text: `${dtc.code} — ${dtc.title}. ${dtc.description} Common fix: ${dtc.commonFix}. Estimated cost: ${dtc.estimatedCostRange}.`,
                author: schemaAuthor,
                datePublished: schemaDate,
                upvoteCount: 0,
                url: pageUrl,
            },
        },
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

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(qaSchema) }}
            />
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
                        { "@type": "ListItem", position: 1, name: "DTC Codes", item: "https://spotonauto.com/codes" },
                        { "@type": "ListItem", position: 2, name: `${dtc.code}: ${dtc.title}`, item: `https://spotonauto.com/codes/${dtc.code.toLowerCase()}` },
                    ],
                }) }}
            />
            <CodePageClient code={dtc} manualLinks={manualLinks} />
        </div>
    );
}
