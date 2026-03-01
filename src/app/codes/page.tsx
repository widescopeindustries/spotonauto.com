import { Metadata } from 'next';
import { DTC_SYSTEMS } from '@/data/dtc-codes-data';
import CodesIndex from './CodesIndex';

export const metadata: Metadata = {
    title: 'OBD2 DTC Trouble Code Lookup | All P, B, C, U Codes — SpotOn Auto',
    description: 'Free OBD2 trouble code lookup. Find what your check engine light means with 300+ DTC codes explained in plain English. Symptoms, causes, fixes, and cost estimates.',
    keywords: ['OBD2 codes', 'DTC codes', 'check engine light codes', 'trouble codes', 'P0420', 'engine codes', 'car diagnostic codes'],
    openGraph: {
        title: 'OBD2 DTC Trouble Code Lookup — SpotOn Auto',
        description: 'Free OBD2 trouble code lookup. 300+ codes explained in plain English with symptoms, causes, and fixes.',
        type: 'website',
        url: 'https://spotonauto.com/codes',
    },
    alternates: {
        canonical: 'https://spotonauto.com/codes',
    },
};

export default function CodesPage() {
    const systems = DTC_SYSTEMS;

    // QAPage schema for the index
    const qaSchema = {
        '@context': 'https://schema.org',
        '@type': 'QAPage',
        mainEntity: {
            '@type': 'Question',
            name: 'What do OBD2 trouble codes mean?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'OBD2 trouble codes (DTCs) are diagnostic codes stored by your vehicle\'s computer when it detects a problem. Codes starting with P are powertrain (engine/transmission), B are body, C are chassis, and U are network/communication. Each code points to a specific system or component that needs attention.',
            },
        },
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(qaSchema) }}
            />

            {/* Hero */}
            <section className="py-16 px-4 max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/5 mb-6 text-sm font-semibold uppercase tracking-wider text-cyan-400">
                        <span>🔍</span>
                        <span>DTC Code Lookup</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        OBD2 Trouble Code <span className="text-cyan-400">Lookup</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        300+ diagnostic trouble codes explained in plain English. Find what your check engine light means, what it costs, and how to fix it.
                    </p>
                </div>

                <CodesIndex systems={systems} />
            </section>
        </div>
    );
}
