import DiagnosticChatRoute from './DiagnosticChatRoute';
import DiagnosticVehicleSelector from './DiagnosticVehicleSelector';

interface SearchParams {
    [key: string]: string | string[] | undefined;
}

function firstParam(value: string | string[] | undefined): string {
    if (Array.isArray(value)) return value[0] || '';
    return value || '';
}

export default async function DiagnosticPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = await searchParams;
    const year = firstParam(params.year);
    const make = firstParam(params.make);
    const model = firstParam(params.model);
    const initialTask = firstParam(params.task);
    const hasVehicle = Boolean(year && make && model);

    return (
        <>
            <h1 className="pt-24 mb-4 text-center text-2xl font-display font-bold text-white">AI Car Diagnosis</h1>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'SoftwareApplication',
                        name: 'SpotOnAuto AI Diagnostic Tool',
                        applicationCategory: 'AutomotiveApplication',
                        operatingSystem: 'Web',
                        offers: {
                            '@type': 'Offer',
                            price: '0',
                            priceCurrency: 'USD',
                        },
                    }),
                }}
            />

            {hasVehicle ? (
                <div className="flex min-h-[calc(100vh-80px)] w-full flex-col items-center p-4 md:p-8">
                    <h2 className="mb-8 text-2xl font-mono uppercase tracking-widest text-neon-cyan">
                        SYSTEM DIAGNOSTICS
                    </h2>
                    <DiagnosticChatRoute />
                </div>
            ) : (
                <div className="flex min-h-screen w-full flex-col items-center bg-[#050505] px-4 pt-28 pb-16">
                    <DiagnosticVehicleSelector initialTask={initialTask} />
                </div>
            )}
        </>
    );
}
