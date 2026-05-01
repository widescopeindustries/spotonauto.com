import DiagnosticChatRoute from './DiagnosticChatRoute';
import DiagnosticVehicleSelector from './DiagnosticVehicleSelector';
import { PricingTrackedLink } from '@/components/PricingTracking';
import SearchLandingMonetizationRail from '@/components/SearchLandingMonetizationRail';
import TopdonProductSpotlight from '@/components/TopdonProductSpotlight';
import SafetyWarningBox from '@/components/SafetyWarningBox';
import WhenToSeeMechanic from '@/components/WhenToSeeMechanic';

interface SearchParams {
    [key: string]: string | string[] | undefined;
}

function firstParam(value: string | string[] | undefined): string {
    if (Array.isArray(value)) return value[0] || '';
    return value || '';
}

const EXAMPLE_FLOWS = [
    {
        symptom: 'Car shakes at idle + check engine light',
        likelyPath: 'Scan codes → inspect ignition coil/plug condition → verify fuel trim.',
    },
    {
        symptom: 'Battery light on while driving',
        likelyPath: 'Check charging voltage → inspect alternator belt/tensioner → test alternator output.',
    },
    {
        symptom: 'Brake pedal feels soft',
        likelyPath: 'Inspect brake fluid level/leaks → bleed system if needed → inspect master cylinder and calipers.',
    },
    {
        symptom: 'Engine overheats in traffic',
        likelyPath: 'Check coolant level and fan operation → inspect thermostat flow → pressure test for leaks.',
    },
];

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
    const initialVin = firstParam(params.vin);
    const initialMode = firstParam(params.mode) as 'ymm' | 'vin' | '';
    const hasVehicle = Boolean(year && make && model);

    return (
        <>
            <h1 className="pt-24 mb-4 text-center text-2xl font-display font-bold text-white">What&apos;s Wrong with Your Car?</h1>
            <div className="mx-auto mb-6 w-full max-w-4xl px-4">
                <SafetyWarningBox />
            </div>
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
                        AI DIAGNOSIS
                    </h2>
                    <DiagnosticChatRoute />
                    <div className="mt-8 w-full max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">Example Symptom Flows</p>
                        <div className="mt-4 space-y-3">
                            {EXAMPLE_FLOWS.slice(0, 3).map((flow) => (
                                <div key={flow.symptom} className="rounded-xl border border-white/10 bg-black/20 p-4">
                                    <p className="text-sm font-semibold text-white">{flow.symptom}</p>
                                    <p className="mt-2 text-sm text-gray-300">{flow.likelyPath}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-8 w-full max-w-3xl rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.08] p-5 text-center">
                        <p className="text-sm text-cyan-100">
                            If you already have a mechanic estimate, run a fast quote check before you approve repairs.
                        </p>
                        <div className="mt-4 flex flex-wrap justify-center gap-3">
                            <PricingTrackedLink
                                href="/second-opinion"
                                target="starter_free"
                                label="diagnose_with_vehicle_quote_check"
                                className="inline-flex items-center justify-center rounded-lg bg-cyan-300 px-4 py-2 text-sm font-bold text-black transition hover:bg-cyan-200"
                            >
                                Free Quote Check
                            </PricingTrackedLink>
                            <PricingTrackedLink
                                href="/pricing"
                                target="pro_waitlist"
                                label="diagnose_with_vehicle_quote_pro"
                                className="inline-flex items-center justify-center rounded-lg border border-cyan-200/40 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-100 hover:text-white"
                            >
                                Quote Shield Pro
                            </PricingTrackedLink>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex min-h-screen w-full flex-col items-center bg-[#050505] px-4 pt-28 pb-16">
                    <DiagnosticVehicleSelector initialTask={initialTask} initialVin={initialVin} initialMode={initialMode} />
                    <div className="mt-8 w-full max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">Example Symptom Flows</p>
                        <div className="mt-4 space-y-3">
                            {EXAMPLE_FLOWS.map((flow) => (
                                <div key={flow.symptom} className="rounded-xl border border-white/10 bg-black/20 p-4">
                                    <p className="text-sm font-semibold text-white">{flow.symptom}</p>
                                    <p className="mt-2 text-sm text-gray-300">{flow.likelyPath}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-8 w-full max-w-3xl rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.08] p-5 text-center">
                        <p className="text-sm text-cyan-100">
                            Already got a quote from a shop? Check pricing fairness in under a minute.
                        </p>
                        <div className="mt-4 flex flex-wrap justify-center gap-3">
                            <PricingTrackedLink
                                href="/second-opinion"
                                target="starter_free"
                                label="diagnose_selector_quote_check"
                                className="inline-flex items-center justify-center rounded-lg bg-cyan-300 px-4 py-2 text-sm font-bold text-black transition hover:bg-cyan-200"
                            >
                                Free Quote Check
                            </PricingTrackedLink>
                            <PricingTrackedLink
                                href="/pricing"
                                target="pro_waitlist"
                                label="diagnose_selector_quote_pro"
                                className="inline-flex items-center justify-center rounded-lg border border-cyan-200/40 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-100 hover:text-white"
                            >
                                Quote Shield Pro
                            </PricingTrackedLink>
                        </div>
                    </div>
                </div>
            )}

            <div className="px-4 pb-16 md:px-8">
                <div className="mx-auto w-full max-w-5xl space-y-8">
                    <SearchLandingMonetizationRail
                        surface="diagnose_page"
                        intent="diagnostic"
                        contextLabel="OBD2 scanner"
                    />
                    <TopdonProductSpotlight
                        productKey="topscan"
                        title="Better scan-tool follow-up"
                        reason="If the diagnosis points to a wiring, battery, or module issue, a wireless scan tool keeps the workflow moving."
                        surface="diagnose_page"
                    />
                    <WhenToSeeMechanic />
                </div>
            </div>
        </>
    );
}
