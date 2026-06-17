import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AI Training Feed — AllOEMManuals',
  description:
    'Clean, structured factory manual data for 300,000+ vehicles. Purpose-built for AI training, RAG, and agent consumption. Pay-per-page via Stripe or x402.',
  robots: 'index, follow',
};

export const dynamic = 'force-static';

const PRICING = [
  { name: 'Starter', price: '$10', credits: '1,000', perPage: '$0.0100' },
  { name: 'Growth', price: '$50', credits: '5,500', perPage: '$0.0091' },
  { name: 'Scale', price: '$200', credits: '24,000', perPage: '$0.0083' },
  { name: 'Enterprise', price: '$1,000', credits: '130,000', perPage: '$0.0077' },
];

const SAMPLE_ENDPOINTS = [
  { path: '/api/data/2010/toyota/camry', desc: 'Full vehicle hub' },
  { path: '/api/data/2010/toyota/camry/repairs/oil-change', desc: 'Specific repair guide' },
  { path: '/api/data/2010/toyota/camry/dtc', desc: 'Diagnostic trouble codes' },
  { path: '/api/data/2010/toyota/camry/specs', desc: 'Factory specifications' },
];

export default function ForAIPage() {
  const checkoutUrl = 'https://alloemmanuals.com/api/stripe/checkout?pack=starter';

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            AI Training Feed
          </h1>
          <p className="mt-4 text-xl text-slate-600">
            Clean, structured factory manual data for 300,000+ vehicles — built for AI training,
            RAG grounding, and agent consumption.
          </p>
        </header>

        <section className="mb-12 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-2xl font-semibold text-slate-950">Why this feed exists</h2>
          <p className="mt-4 text-slate-700">
            The public HTML site is built for humans: navigation, affiliate links, ads, and rich
            formatting. The AI Training Feed is the same underlying corpus repackaged for machines:
          </p>
          <ul className="mt-6 space-y-3 text-slate-700">
            <li className="flex items-start gap-3">
              <span className="text-emerald-600">✓</span>
              <span>Clean Markdown — no HTML parsing required</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-600">✓</span>
              <span>Zero affiliate links or ads — pure content</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-600">✓</span>
              <span>Vehicle-specific data only — every URL is tied to a real year/make/model</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-600">✓</span>
              <span>OEM excerpts, torque specs, DTC codes, wiring diagrams, repair procedures</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-emerald-600">✓</span>
              <span>Knowledge graphs linking components, codes, symptoms, and procedures</span>
            </li>
          </ul>
        </section>

        <section className="mb-12 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-2xl font-semibold text-slate-950">Pricing</h2>
          <p className="mt-4 text-slate-700">
            Prepaid credits. One page = one credit. No subscriptions, no commitments.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRICING.map((p) => (
              <div
                key={p.name}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center"
              >
                <div className="text-sm font-medium text-slate-500">{p.name}</div>
                <div className="mt-2 text-3xl font-bold text-slate-950">{p.price}</div>
                <div className="mt-1 text-slate-700">{p.credits} credits</div>
                <div className="mt-1 text-sm text-slate-500">{p.perPage}/page</div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-slate-500">
            Volume discounts: 100K+ pages/month at $0.005/page, 1M+ at $0.001/page.
            Enterprise licensing available.
          </p>
        </section>

        <section className="mb-12 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-2xl font-semibold text-slate-950">How to buy</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-slate-700">
            <li>
              Create a checkout session:{' '}
              <a
                href={checkoutUrl}
                className="font-medium text-blue-600 underline underline-offset-2"
              >
                {checkoutUrl}
              </a>
              <br />
              <span className="text-sm text-slate-500">
                (Replace <code>pack=starter</code> with growth, scale, or enterprise.)
              </span>
            </li>
            <li>Complete payment.</li>
            <li>Your API key is returned at the success URL and via webhook.</li>
            <li>Include the key on every request: Authorization: Bearer {'<api_key>'}</li>
          </ol>
          <div className="mt-6">
            <a
              href={checkoutUrl}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Buy credits
            </a>
          </div>
        </section>

        <section className="mb-12 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-2xl font-semibold text-slate-950">Sample endpoints</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {SAMPLE_ENDPOINTS.map((ep) => (
              <div key={ep.path} className="flex flex-col py-3 sm:flex-row sm:items-center sm:justify-between">
                <code className="text-sm text-blue-600">{ep.path}</code>
                <span className="text-sm text-slate-500">{ep.desc}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12 rounded-2xl bg-slate-900 p-8 text-slate-100">
          <h2 className="text-2xl font-semibold text-white">Sample response</h2>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-300">
{`# 2010 Toyota Camry — Factory Service Manual Data

## Engine — 2.5L 2AR-FE
- **Displacement:** 2.5 L (2,494 cc)
- **Power:** 169 hp @ 6,000 rpm
- **Torque:** 167 lb-ft @ 4,100 rpm
- **Oil capacity:** 4.5 qt (4.3 L) with filter
- **Oil type:** 0W-20 synthetic

## Common Repairs
### Oil Change
**Interval:** 5,000–10,000 miles depending on oil type and driving conditions.

**Procedure:**
1. Warm engine to operating temperature.
2. Remove drain plug and drain oil.
3. Replace drain plug washer.
4. Remove and replace oil filter.
5. Fill with 0W-20 synthetic oil to 4.5 qt.

**Torque specs:**
- Drain plug: 30 N·m (22 ft-lb)
- Oil filter: hand-tight + 3/4 turn

## Diagnostic Trouble Codes
- **P0017** — Crankshaft position/camshaft position correlation (Bank 1 Sensor B)
- **P0300** — Random/multiple cylinder misfire detected
`}
          </pre>
        </section>

        <section className="mb-12 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-2xl font-semibold text-slate-950">Agent-native payment</h2>
          <p className="mt-4 text-slate-700">
            For agents that support the x402 protocol, payment discovery is available at:
          </p>
          <ul className="mt-4 space-y-2 text-slate-700">
            <li>
              <Link href="/.well-known/acp.json" className="text-blue-600 underline underline-offset-2">
                /.well-known/acp.json
              </Link>{' '}
              — Agentic Commerce Protocol
            </li>
            <li>
              <Link href="/openapi.json" className="text-blue-600 underline underline-offset-2">
                /openapi.json
              </Link>{' '}
              — OpenAPI spec with payment info
            </li>
            <li>
              <Link href="/.well-known/api-catalog" className="text-blue-600 underline underline-offset-2">
                /.well-known/api-catalog
              </Link>{' '}
              — API catalog
            </li>
          </ul>
        </section>

        <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-2xl font-semibold text-slate-950">Contact</h2>
          <p className="mt-4 text-slate-700">
            For enterprise licensing, custom data formats, or volume agreements, contact:
          </p>
          <p className="mt-2 text-lg font-medium text-slate-900">
            <a href="mailto:lyndon@widescopeindustries.com" className="text-blue-600 underline underline-offset-2">
              lyndon@widescopeindustries.com
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
