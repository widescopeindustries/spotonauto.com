import { Metadata } from 'next';
import { DTC_SYSTEMS } from '@/data/dtc-codes-data';
import CodesIndex from './CodesIndex';
import SearchLandingMonetizationRail from '@/components/SearchLandingMonetizationRail';

export const metadata: Metadata = {
    title: 'OBD2 Code Lookup | SpotOnAuto',
    description: 'Free OBD2 trouble code lookup. Find what your check engine light means with 8,500+ DTC codes explained in plain English — symptoms, likely causes, and DIY fixes.',
    keywords: ['OBD2 codes', 'DTC codes', 'check engine light codes', 'trouble codes', 'P0420', 'engine codes', 'car diagnostic codes'],
    openGraph: {
        title: 'OBD2 DTC Trouble Code Lookup — SpotOn Auto',
        description: 'Free OBD2 trouble code lookup. 300+ codes explained in plain English with symptoms, causes, and fixes.',
        type: 'website',
        url: 'https://spotonauto.com/codes',
        images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'SpotOnAuto - Free DIY Auto Repair Guides' }],
    },
    alternates: {
        canonical: 'https://spotonauto.com/codes',
    },
};

export default function CodesPage() {
    const systems = DTC_SYSTEMS;
    const schemaDate = '2026-03-05';
    const schemaAuthor = {
        '@type': 'Organization',
        name: 'SpotOnAuto Editorial Team',
        url: 'https://spotonauto.com',
    };

    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [{
            '@type': 'Question',
            name: 'What do OBD2 trouble codes mean?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'OBD2 trouble codes (DTCs) are diagnostic codes stored by your vehicle computer when it detects a problem. P codes cover powertrain, B codes cover body, C codes cover chassis, and U codes cover network communication systems.',
            },
        }],
    };

    const webPageSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'OBD2 Code Lookup | SpotOnAuto',
        description: metadata.description,
        url: 'https://spotonauto.com/codes',
        datePublished: schemaDate,
        dateModified: schemaDate,
        author: schemaAuthor,
        publisher: schemaAuthor,
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
            />

            {/* Hero */}
            <section className="py-16 px-4 max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-2 mb-6 text-sm font-medium tracking-wide text-cyan-300">
                        <span>🔍</span>
                        <span>DTC Code Lookup</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-4">
                        OBD2 Trouble Code <span className="text-cyan-400">Lookup</span>
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg leading-8 text-gray-400">
                        300+ diagnostic trouble codes explained in plain English. Find what your check engine light means, what it costs, and how to fix it.
                    </p>
                </div>

                <SearchLandingMonetizationRail
                    surface="codes_index"
                    intent="diagnostic"
                    contextLabel="check engine light"
                />

                <CodesIndex systems={systems} />
            </section>
        </div>
    );
}
