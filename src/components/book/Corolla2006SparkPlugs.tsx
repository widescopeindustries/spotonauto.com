import Link from 'next/link';
import AdUnit from '@/components/AdUnit';
import AffiliateLink from '@/components/AffiliateLink';
import RiskAcknowledgementGate from '@/components/RiskAcknowledgementGate';
import { buildAmazonSearchUrl } from '@/lib/amazonAffiliate';

const PAGE = 'https://alloemmanuals.com/repair/2006/toyota/corolla/spark-plug-replacement';
const VEHICLE = '2006 Toyota Corolla';

const STEPS = [
  'On the 1ZZ-FE, do not clean a plug with a wire brush, and do not change the gap on a used plug.',
  'Blow a 1ZZ-FE plug clean with air below 588 kPa (6.0 kg/cm², 85 psi), for 20 seconds or less.',
  'On the 1ZZ-FE, check the threads and the insulator. If either is damaged, replace the plug. The book calls for DENSO SK16R11 or NGK IFR5A11.',
  'On the 1ZZ-FE, set the gap to 1.0 to 1.3 mm (0.039 to 0.051 in.).',
  'On the 1ZZ-FE, check for a stored code before the spark test. If a code is present, follow that code.',
  'On the 1ZZ-FE, remove the ignition coils, then remove the plugs with a 16 mm (0.63 in.) plug wrench.',
  'On the 1ZZ-FE spark test, seat each plug in a coil, connect the coil, unplug the four injectors, and ground the plugs. Crank no more than 2 seconds.',
  'On the 1ZZ-FE, install the plugs at 25 N·m (255 kgf·cm, 18 ft·lbf) and the coil bolts at 9.0 N·m (92 kgf·cm, 80 in·lbf).',
  'On the 2ZZ-GE, use DENSO SK20R11 or NGK IFR6A11. The gap is 1.0 to 1.3 mm (0.039 to 0.051 in.).',
  'On the 2ZZ-GE, install the plugs at 18 N·m (178 kgf·cm, 13 ft·lbf). The coil bolts are 9.0 N·m. The wrench is 16 mm.',
];

function partLink(query: string, label: string) {
  return (
    <AffiliateLink
      href={buildAmazonSearchUrl(query, 'automotive', '2006-toyota-corolla-spark-plug-replacement')}
      partName={label}
      vehicle={VEHICLE}
      pageType="repair_guide"
      className="text-sky-400 hover:text-sky-300 underline"
    >
      {label}
    </AffiliateLink>
  );
}

export default function Corolla2006SparkPlugs({
  vehicleHubHref,
}: {
  vehicleHubHref: string;
}) {
  const howTo = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Spark plugs on a 2006 Toyota Corolla',
    description: '1ZZ-FE plugs are DENSO SK16R11 or NGK IFR5A11, gap 1.0 to 1.3 mm, torque 25 N·m. 2ZZ-GE plugs are DENSO SK20R11 or NGK IFR6A11, torque 18 N·m.',
    tool: [{ '@type': 'HowToTool', name: '16 mm (0.63 in.) spark plug wrench' }],
    supply: [
      { '@type': 'HowToSupply', name: '1ZZ-FE DENSO SK16R11' },
      { '@type': 'HowToSupply', name: '1ZZ-FE NGK IFR5A11' },
      { '@type': 'HowToSupply', name: '2ZZ-GE DENSO SK20R11' },
      { '@type': 'HowToSupply', name: '2ZZ-GE NGK IFR6A11' },
    ],
    step: STEPS.map((text, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: `Step ${index + 1}`,
      text,
      url: `${PAGE}#step-${index + 1}`,
    })),
  };

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What spark plug does a 2006 Toyota Corolla 1ZZ-FE use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'DENSO SK16R11 or NGK IFR5A11.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the spark plug gap on a 2006 Toyota Corolla?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '1.0 to 1.3 mm (0.039 to 0.051 in.) on both the 1ZZ-FE and the 2ZZ-GE.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the spark plug torque on a 2006 Toyota Corolla 1ZZ-FE?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '25 N·m (255 kgf·cm, 18 ft·lbf). The ignition coil bolt is 9.0 N·m (92 kgf·cm, 80 in·lbf).',
        },
      },
      {
        '@type': 'Question',
        name: 'What spark plug and torque does the 2006 Toyota Corolla 2ZZ-GE use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'DENSO SK20R11 or NGK IFR6A11. Plug torque is 18 N·m (178 kgf·cm, 13 ft·lbf). The coil bolt is 9.0 N·m.',
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
        <Link href={vehicleHubHref} className="hover:text-sky-400">Toyota Corolla</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-300">2006</span>
      </nav>

      <article className="mv-content max-w-5xl mx-auto px-4 py-8 md:py-10">
        <header className="mb-8 max-w-3xl">
          <p className="text-sm font-medium tracking-wide text-sky-300/80 mb-2">2006 Toyota Corolla</p>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-white mb-3">Spark plugs</h1>
          <p className="text-base md:text-lg leading-7 text-gray-300">
            The book has two engines. Use the plug number and the torque for the engine code on the truck.
          </p>
        </header>

        <section id="quick-answer" className="mb-8 max-w-3xl rounded-2xl border border-sky-400/30 bg-sky-500/10 p-6 md:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Quick answer</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">1ZZ-FE plug number, gap, and torque</h2>
          <p className="mt-3 text-lg leading-8 text-white">
            DENSO SK16R11 or NGK IFR5A11. Gap 1.0 to 1.3 mm (0.039 to 0.051 in.). Tighten the plug to 25 N·m (18 ft·lbf) with a 16 mm wrench. The coil bolt is 9.0 N·m (80 in·lbf).
          </p>
          <p className="mt-3 text-base leading-7 text-gray-200">
            The 2ZZ-GE calls for DENSO SK20R11 or NGK IFR6A11. Same gap. Plug torque is 18 N·m (13 ft·lbf).
          </p>
          <p className="mt-4 text-sm leading-6 text-gray-400">
            1ZZ-FE spark plug specification and torque table. 2ZZ-GE specification and install step. The 2ZZ torque table is titled “TORQUE SPECIFICATIONS - 2ZZ-FE” on the 2ZZ-GE page.
          </p>
        </section>

        <section className="mb-8 max-w-3xl">
          <h2 className="text-xl font-semibold text-white mb-4">1ZZ-FE plugs</h2>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-400">
                <th className="border-b border-white/10 py-2 pr-3">Book calls it</th>
                <th className="border-b border-white/10 py-2">Number</th>
              </tr>
            </thead>
            <tbody className="text-gray-100">
              <tr><td className="border-b border-white/10 py-2 pr-3">DENSO</td><td className="border-b border-white/10 py-2">SK16R11</td></tr>
              <tr><td className="border-b border-white/10 py-2 pr-3">NGK</td><td className="border-b border-white/10 py-2">IFR5A11</td></tr>
              <tr><td className="border-b border-white/10 py-2 pr-3">Gap</td><td className="border-b border-white/10 py-2">1.0 to 1.3 mm (0.039 to 0.051 in.)</td></tr>
              <tr><td className="border-b border-white/10 py-2 pr-3">Replace</td><td className="border-b border-white/10 py-2">Every 192,000 km (120,000 miles)</td></tr>
            </tbody>
          </table>
          <p className="mt-3 text-sm text-gray-400">Inspection, Ignition System (1ZZ-FE). The data table prints the same two numbers.</p>
          <ul className="mt-4 space-y-2">
            <li>{partLink('DENSO SK16R11 spark plug', 'DENSO SK16R11')}</li>
            <li>{partLink('NGK IFR5A11 spark plug', 'NGK IFR5A11')}</li>
          </ul>
          <p className="mt-2 text-sm text-gray-400">Search links. The book gives these numbers.</p>

          <ol className="mt-6 space-y-5 list-decimal pl-5">
            <li id="step-1">Do not clean a plug with a wire brush. Do not change the gap on a used plug.
              <p className="text-sm text-gray-400 mt-1">Inspection note, 1ZZ-FE.</p>
            </li>
            <li id="step-2">Blow the plug clean. Keep the air below 588 kPa (6.0 kg/cm², 85 psi), for 20 seconds or less.
              <figure className="mt-3 bg-white rounded p-2">
                <img src="/manual-media/images25/G02613782/" alt="Cleaning the spark plug" className="w-full h-auto" />
              </figure>
              <p className="text-sm text-gray-400 mt-1">Fig 1: Cleaning Spark Plug. Drawing G02613782.</p>
            </li>
            <li id="step-3">Look at the threads and the insulator. If either is damaged, replace the plug.
              <figure className="mt-3 bg-white rounded p-2">
                <img src="/manual-media/images25/G02613783/" alt="Checking the spark plug threads and insulator" className="w-full h-auto" />
              </figure>
              <p className="text-sm text-gray-400 mt-1">Fig 2. Drawing G02613783. Recommended spark plug: SK16R11 (DENSO made), IFR5A11 (NGK made).</p>
            </li>
            <li id="step-4">Check the gap. It should be 1.0 to 1.3 mm (0.039 to 0.051 in.).
              <figure className="mt-3 bg-white rounded p-2">
                <img src="/manual-media/images25/G02613784/" alt="Checking the spark plug gap" className="w-full h-auto" />
              </figure>
              <p className="text-sm text-gray-400 mt-1">Fig 3: Checking Spark Plug Electrode Gap. Drawing G02613784.</p>
            </li>
          </ol>
        </section>

        <AdUnit slot="repair-after-parts" format="rectangle" />

        <section className="mb-8 max-w-3xl">
          <h2 className="text-xl font-semibold text-white mb-2">1ZZ-FE, plugs out and back in</h2>
          <p className="text-gray-300 mb-4">The book puts the wrench and the torque in the spark test.</p>
          <ol className="space-y-5 list-decimal pl-5" start={5}>
            <li id="step-5">Check for a stored code first. If one is there, follow that code. This page does not name one.
              <p className="text-sm text-gray-400 mt-1">On-Vehicle Inspection, 1ZZ-FE. “If a DTC is present, perform troubleshooting in accordance with the procedure for that DTC.”</p>
            </li>
            <li id="step-6">Take the ignition coils off.
              <p className="text-sm text-gray-400 mt-1">“Remove the ignition coils (with igniter).”</p>
            </li>
            <li id="step-7">Take the plugs out with a 16 mm (0.63 in.) plug wrench.
              <p className="text-sm text-gray-400 mt-1">“Using a 16 mm (0.63 in) plug wrench, remove the spark plugs.”</p>
            </li>
            <li id="step-8">To watch for spark, seat each plug in a coil, connect the coil, unplug the four injectors, and ground the plugs. Crank, and stop by 2 seconds. If you feel a hit while holding a plug, replace that coil.
              <p className="text-sm text-gray-400 mt-1">“Be sure to ground the spark plugs when checking.” “Do not crank the engine for more than 2 seconds.” “Replace the ignition coil if a physical impact is felt while holding the spark plugs.”</p>
            </li>
            <li id="step-9">Put the plugs back with the 16 mm wrench. Tighten them to 25 N·m (255 kgf·cm, 18 ft·lbf).
              <p className="text-sm text-gray-400 mt-1">Install step: “Torque: 25 N.m (255 kgf.cm, 18 ft.lbf).” Torque table row: “Spark plug at Cylinder head cover,” 25 N.m.</p>
            </li>
            <li>Put the coils back. Tighten the bolts to 9.0 N·m (92 kgf·cm, 80 in·lbf).
              <p className="text-sm text-gray-400 mt-1">Install step prints “80 in..lbf”. Torque table prints “80 in.lbf”.</p>
            </li>
          </ol>
        </section>

        <section className="mb-8 max-w-3xl">
          <h2 className="text-xl font-semibold text-white mb-4">2ZZ-GE plugs</h2>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-400">
                <th className="border-b border-white/10 py-2 pr-3">Book calls it</th>
                <th className="border-b border-white/10 py-2">Number</th>
              </tr>
            </thead>
            <tbody className="text-gray-100">
              <tr><td className="border-b border-white/10 py-2 pr-3">DENSO</td><td className="border-b border-white/10 py-2">SK20R11</td></tr>
              <tr><td className="border-b border-white/10 py-2 pr-3">NGK</td><td className="border-b border-white/10 py-2">IFR6A11</td></tr>
              <tr><td className="border-b border-white/10 py-2 pr-3">Gap</td><td className="border-b border-white/10 py-2">1.0 to 1.3 mm (0.039 to 0.051 in.)</td></tr>
              <tr><td className="border-b border-white/10 py-2 pr-3">Plug torque</td><td className="border-b border-white/10 py-2">18 N·m (178 kgf·cm, 13 ft·lbf)</td></tr>
              <tr><td className="border-b border-white/10 py-2 pr-3">Coil bolt</td><td className="border-b border-white/10 py-2">9.0 N·m (80 in·lbf)</td></tr>
            </tbody>
          </table>
          <p className="mt-3 text-sm text-gray-400">Inspection, Ignition System (2ZZ-GE). Install step: 18 N.m (178 kgf.cm, 13 ft.lbf). Torque table title on that page: “TORQUE SPECIFICATIONS - 2ZZ-FE”. Row: “Spark plug at Cylinder head.”</p>
          <ul className="mt-4 space-y-2">
            <li>{partLink('DENSO SK20R11 spark plug', 'DENSO SK20R11')}</li>
            <li>{partLink('NGK IFR6A11 spark plug', 'NGK IFR6A11')}</li>
          </ul>
          <ol className="mt-6 space-y-5 list-decimal pl-5">
            <li>Same cleaning rule. No wire brush. Do not adjust the gap on a used plug. Same 192,000 km (120,000 miles). Same air limit, 588 kPa (85 psi), 20 seconds or less.
              <figure className="mt-3 bg-white rounded p-2">
                <img src="/manual-media/images25/G02613786/" alt="Cleaning the 2ZZ-GE spark plug" className="w-full h-auto" />
              </figure>
              <p className="text-sm text-gray-400 mt-1">Fig 1, 2ZZ-GE. Drawing G02613786.</p>
            </li>
            <li>Check the threads and the insulator. The book’s numbers here are SK20R11 and IFR6A11.
              <figure className="mt-3 bg-white rounded p-2">
                <img src="/manual-media/images25/G02613787/" alt="Checking the 2ZZ-GE spark plug" className="w-full h-auto" />
              </figure>
              <p className="text-sm text-gray-400 mt-1">Fig 2, 2ZZ-GE. Drawing G02613787.</p>
            </li>
            <li>Check the gap. 1.0 to 1.3 mm (0.039 to 0.051 in.).
              <figure className="mt-3 bg-white rounded p-2">
                <img src="/manual-media/images25/G02613788/" alt="Checking the 2ZZ-GE spark plug gap" className="w-full h-auto" />
              </figure>
              <p className="text-sm text-gray-400 mt-1">Fig 3, 2ZZ-GE. Drawing G02613788.</p>
            </li>
            <li id="step-10">The plug wrench is 16 mm. Tighten the plug to 18 N·m (13 ft·lbf). Tighten the coil bolt to 9.0 N·m.
              <p className="text-sm text-gray-400 mt-1">On-Vehicle Inspection, 2ZZ-GE. “Using a 16 mm (0.63 in) plug wrench.” Install step: “Torque: 18 N.m (178 kgf.cm, 13 ft.lbf).”</p>
            </li>
          </ol>
        </section>

        <section className="mb-8 max-w-3xl rounded-xl border border-amber-400/30 bg-amber-500/10 p-5">
          <h2 className="text-lg font-semibold text-white mb-2">What the book does not give</h2>
          <p className="text-gray-200 leading-7">The book does not say which trim is the 1ZZ-FE and which trim is the 2ZZ-GE. Match the engine code on the truck.</p>
          <p className="mt-3 text-gray-200 leading-7">The 1ZZ-FE camshaft-sensor line on the inspection page drops the low end of the resistance. The data table says 835 to 1,400 Ω cold. That check stays on its own page.</p>
          <p className="mt-3 text-gray-200 leading-7">The shop-inspection map says you are not required to replace spark plugs in sets.</p>
        </section>

        <AdUnit slot="repair-after-faq" format="horizontal" />
      </article>
    </>
  );
}
