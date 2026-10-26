import Link from 'next/link';
import AffiliateLink from '@/components/AffiliateLink';
import RiskAcknowledgementGate from '@/components/RiskAcknowledgementGate';
import { buildAmazonSearchUrl } from '@/lib/amazonAffiliate';

const PAGE = 'https://alloemmanuals.com/repair/2022/buick/encore/thermostat-replacement';
const VEHICLE = '2022 Buick Encore';
const SUBTAG = '2022-buick-encore-thermostat-replacement';

type BookStep = {
  text: string;
  source?: string;
  image?: { id: string; alt: string };
  link?: { query: string; label: string };
};

const HOSE_STEPS: BookStep[] = [
  {
    text: 'Drain the coolant.',
    source: 'Cooling system draining and filling is its own job.',
  },
  {
    text: 'Take the air cleaner off.',
    source: 'Air Cleaner Assembly Replacement, callout 1. Drawing GM4090778.',
    image: { id: 'GM4090778', alt: 'Air cleaner, callout 1' },
  },
  {
    text: 'Take off the hose that feeds the charge-air cooler.',
    source: 'Charge Air Cooler Inlet Air Hose Replacement, callout 2. Drawing GM4113279.',
    image: { id: 'GM4113279', alt: 'Charge-air cooler inlet hose, callout 2' },
  },
  {
    text: 'At the radiator, open the lower hose clamp with hose-clamp pliers and slide it back.',
    source: 'Radiator outlet hose clamp, callout 1. Tool BO-38185. Drawing GM4116829.',
    image: { id: 'GM4116829', alt: 'Lower hose clamp at the radiator, callout 1' },
  },
  {
    text: 'Pull the lower hose off the radiator.',
    source: 'Radiator outlet hose, callout 2.',
  },
  {
    text: 'At the engine, open the other clamp with the same pliers.',
    source: 'Callout 1. Tool BO-38185. Drawing GM4116815.',
    image: { id: 'GM4116815', alt: 'Lower hose clamp at the engine, callout 1' },
  },
  {
    text: 'Pull the hose off the engine.',
    source: 'Radiator outlet hose, callout 2.',
  },
  {
    text: 'Lift the hose out.',
  },
];

const HOUSING_STEPS: BookStep[] = [
  {
    text: 'The lower hose is already off the housing.',
  },
  {
    text: 'Remove the two housing bolts. When they go back on, tighten them to 10 N·m (89 lb in).',
    source: 'Engine Coolant Thermostat Housing Bolt, callout 1, quantity 2. Fastener caution.',
  },
  {
    text: 'Use a new gasket.',
    source: 'Engine Coolant Thermostat Housing Gasket, callout 2.',
    link: { query: '2022 Buick Encore 1.4 thermostat gasket', label: 'A new gasket' },
  },
  {
    text: 'The housing is the part that comes off.',
    source: 'Engine Coolant Thermostat Housing, callout 3.',
  },
];

function partLink(query: string, label: string) {
  return (
    <AffiliateLink
      href={buildAmazonSearchUrl(query, 'automotive', SUBTAG)}
      partName={label}
      vehicle={VEHICLE}
      pageType="repair_guide"
      className="text-sky-400 hover:text-sky-300 underline"
    >
      {label}
    </AffiliateLink>
  );
}

function Drawing({ id, alt }: { id: string; alt: string }) {
  return (
    <figure className="mt-3 bg-white rounded p-2">
      <img src={`/manual-media/images25/${id}/`} alt={alt} className="w-full h-auto" />
    </figure>
  );
}

export default function Encore2022ThermostatHousing({
  vehicleHubHref,
}: {
  vehicleHubHref: string;
}) {
  const visibleSteps = [...HOSE_STEPS, ...HOUSING_STEPS];
  const howTo = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Thermostat housing on a 2022 Buick Encore 1.4L',
    description: 'Drain the coolant, take the lower radiator hose off, then remove the thermostat housing. Two bolts tighten to 10 N·m (89 lb in). Use a new gasket. The book gives no thermostat part number.',
    tool: [{ '@type': 'HowToTool', name: 'BO-38185 hose clamp pliers' }],
    supply: [
      { '@type': 'HowToSupply', name: 'Thermostat for the 2022 Buick Encore 1.4L. The book gives no part number.' },
      { '@type': 'HowToSupply', name: 'Engine coolant thermostat housing gasket' },
    ],
    step: visibleSteps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: `Step ${index + 1}`,
      text: step.text,
      url: `${PAGE}#step-${index + 1}`,
    })),
  };

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What torque are the thermostat housing bolts on a 2022 Buick Encore 1.4L?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '10 N·m (89 lb in). There are two bolts.',
        },
      },
      {
        '@type': 'Question',
        name: 'What thermostat part number does the 2022 Buick Encore 1.4L book give?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'None. The book also has no step for pulling a thermostat out of the housing.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do the 2022 Buick Encore AWD and FWD share this thermostat housing job?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Encore GX is a different vehicle.',
        },
      },
    ],
  };

  return (
    <>
      <RiskAcknowledgementGate storageKey="spotonauto:risk_ack:guides:v1" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />

      <nav className="max-w-6xl mx-auto px-4 pt-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-sky-400">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/repair" className="hover:text-sky-400">Repair Hub</Link>
        <span className="mx-2">/</span>
        <Link href={vehicleHubHref} className="hover:text-sky-400">Buick Encore</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-300">2022</span>
      </nav>

      <article className="mv-content max-w-5xl mx-auto px-4 py-8 md:py-10">
        <header className="mb-8 max-w-3xl">
          <p className="text-sm font-medium tracking-wide text-sky-300/80 mb-2">2022 Buick Encore 1.4L</p>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-white mb-3">Thermostat</h1>
          <p className="text-base md:text-lg leading-7 text-gray-300">
            You change the thermostat by unbolting the housing. Get the hose off first. AWD and FWD use the same job. An Encore GX is a different truck.
          </p>
        </header>

        <section id="quick-answer" className="mb-8 max-w-3xl rounded-2xl border border-sky-400/30 bg-sky-500/10 p-6 md:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Quick answer</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Hose off, then two bolts</h2>
          <ul className="mt-4 space-y-2 text-lg leading-8 text-white list-disc pl-5">
            <li>{partLink('2022 Buick Encore 1.4 thermostat', 'Thermostat for this 1.4L')}. No part number is given.</li>
            <li>Drain the coolant before you loosen anything.</li>
            <li>Pull the lower radiator hose off the housing.</li>
            <li>Two bolts. Tighten them to 10 N·m (89 lb in).</li>
            <li>Use a new gasket.</li>
          </ul>
          <p className="mt-4 text-sm leading-6 text-gray-400">
            Factory page: Engine Coolant Thermostat Housing Replacement. Drawing GM4248011. Same page in the AWD book and the FWD book.
          </p>
        </section>

        <section className="mb-8 max-w-3xl">
          <h2 className="text-xl font-semibold text-white mb-2">Get the lower hose off</h2>
          <p className="text-gray-300 mb-4">Do this before the housing bolts.</p>
          <ol className="space-y-5 list-decimal pl-5">
            {HOSE_STEPS.map((step, index) => (
              <li key={step.text} id={`step-${index + 1}`}>
                {step.text}
                {step.image ? <Drawing id={step.image.id} alt={step.image.alt} /> : null}
                {step.source ? <p className="text-sm text-gray-400 mt-1">{step.source}</p> : null}
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-8 max-w-3xl">
          <h2 className="text-xl font-semibold text-white mb-2">Then the housing</h2>
          <Drawing id="GM4248011" alt="Thermostat housing, three callouts" />
          <p className="text-sm text-gray-400 mt-1 mb-4">Drawing GM4248011.</p>
          <ol className="space-y-5 list-decimal pl-5" start={HOSE_STEPS.length + 1}>
            {HOUSING_STEPS.map((step, index) => (
              <li key={step.text} id={`step-${HOSE_STEPS.length + index + 1}`}>
                {step.text}
                {step.link ? (
                  <p className="mt-2">{partLink(step.link.query, step.link.label)}</p>
                ) : null}
                {step.source ? <p className="text-sm text-gray-400 mt-1">{step.source}</p> : null}
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-8 max-w-3xl">
          <h2 className="text-xl font-semibold text-white mb-4">Parts</h2>
          <ul className="space-y-2 text-gray-100">
            <li>{partLink('2022 Buick Encore 1.4 thermostat', 'Thermostat for this 1.4L')}. Search only. No part number is given.</li>
            <li>{partLink('2022 Buick Encore 1.4 thermostat gasket', 'A new gasket')}.</li>
          </ul>
        </section>

        <section className="mb-8 max-w-3xl">
          <h2 className="text-xl font-semibold text-white mb-3">Leave these for another page</h2>
          <ul className="space-y-2 text-gray-200 list-disc pl-5">
            <li>Checking whether the thermostat is bad. That chart sends you here if it needs replacing.</li>
            <li>The bypass hose.</li>
            <li>The bypass pipe.</li>
          </ul>
          <p className="mt-3 text-sm text-gray-400">
            Thermostat Diagnosis. Thermostat Bypass Hose Replacement (LE2). Thermostat Bypass Pipe Replacement (LE2).
          </p>
        </section>

        <section className="mb-8 max-w-3xl rounded-xl border border-amber-400/30 bg-amber-500/10 p-5">
          <h2 className="text-lg font-semibold text-white mb-2">Not in the manual</h2>
          <p className="text-gray-200 leading-7">No part number.</p>
          <p className="mt-3 text-gray-200 leading-7">No step for pulling a thermostat out of the housing.</p>
        </section>
      </article>
    </>
  );
}
