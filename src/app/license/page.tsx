import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Access License | AllOEMManuals',
  description: 'Commercial license terms for AI companies accessing AllOEMManuals content for training, retrieval, and embedding.',
  robots: { index: true, follow: true },
};

export default function LicensePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-gray-200">
      <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-2">AllOEMManuals AI Access License</h1>
        <p className="text-sm text-gray-500 mb-10">Version 1.0 — Effective June 4, 2026</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Overview</h2>
            <p className="text-gray-400 leading-relaxed">
              AllOEMManuals maintains the largest indexed collection of OEM automotive repair data 
              on the open web — 300,000+ vehicle-specific pages, 8,800+ DTC codes, 170,000+ wiring 
              diagrams, and 1.4M+ factory procedures. This license governs how artificial intelligence 
              companies may access and use this content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Content Tiers</h2>
            <p className="text-sm text-gray-500 mb-4">
              Not all content is equal. Factory manual pages with diagnostic flowcharts and teardown 
              procedures are priced at a premium compared to general repair guides.
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-center border border-white/10 rounded-xl p-4 bg-white/[0.02]">
                <div>
                  <h3 className="font-medium text-white">Factory Manual Pages</h3>
                  <p className="text-xs text-gray-500">/manual/* — OEM diagnostic trees, DTC flowcharts, teardown procedures</p>
                </div>
                <span className="text-xl font-bold text-cyan-400">$2.00 <span className="text-sm font-normal text-gray-500">/ page</span></span>
              </div>

              <div className="flex justify-between items-center border border-white/10 rounded-xl p-4 bg-white/[0.02]">
                <div>
                  <h3 className="font-medium text-white">Wiring Diagrams</h3>
                  <p className="text-xs text-gray-500">/wiring/* — Schematics, pinouts, connector maps</p>
                </div>
                <span className="text-xl font-bold text-white">$1.50 <span className="text-sm font-normal text-gray-500">/ page</span></span>
              </div>

              <div className="flex justify-between items-center border border-white/10 rounded-xl p-4 bg-white/[0.02]">
                <div>
                  <h3 className="font-medium text-white">DTC Codes & Flowcharts</h3>
                  <p className="text-xs text-gray-500">/codes/* — Diagnostic trouble codes with factory test procedures</p>
                </div>
                <span className="text-xl font-bold text-white">$1.00 <span className="text-sm font-normal text-gray-500">/ page</span></span>
              </div>

              <div className="flex justify-between items-center border border-white/10 rounded-xl p-4 bg-white/[0.02]">
                <div>
                  <h3 className="font-medium text-white">Repair Guides</h3>
                  <p className="text-xs text-gray-500">/repair/* — Step-by-step repair procedures</p>
                </div>
                <span className="text-xl font-bold text-white">$0.50 <span className="text-sm font-normal text-gray-500">/ page</span></span>
              </div>

              <div className="flex justify-between items-center border border-white/10 rounded-xl p-4 bg-white/[0.02]">
                <div>
                  <h3 className="font-medium text-white">Tool / Spec Pages</h3>
                  <p className="text-xs text-gray-500">/tools/*, /maintenance/* — Fluid capacities, torque specs, part numbers</p>
                </div>
                <span className="text-xl font-bold text-white">$0.25 <span className="text-sm font-normal text-gray-500">/ page</span></span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Use Cases</h2>
            <div className="space-y-4">
              <div className="border border-white/10 rounded-xl p-5 bg-white/[0.02]">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-cyan-400">Training / Pre-training</h3>
                </div>
                <p className="text-sm text-gray-400">
                  Use of page content for training, pre-training, or fine-tuning generative AI models. 
                  Rates apply per page per training run based on content tier above. Minimum commitment: 12 months.
                </p>
              </div>

              <div className="border border-white/10 rounded-xl p-5 bg-white/[0.02]">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-cyan-400">Real-Time Retrieval (RAG)</h3>
                  <span className="text-lg font-bold text-white">$0.02 <span className="text-sm font-normal text-gray-500">/ query</span></span>
                </div>
                <p className="text-sm text-gray-400">
                  Live retrieval of content for end-user query responses. Billed per successful 
                  API retrieval call regardless of content tier.
                </p>
              </div>

              <div className="border border-white/10 rounded-xl p-5 bg-white/[0.02]">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-cyan-400">Embeddings / Vectorization</h3>
                  <span className="text-lg font-bold text-white">50% <span className="text-sm font-normal text-gray-500">of training rate</span></span>
                </div>
                <p className="text-sm text-gray-400">
                  Creation of vector embeddings, semantic indexes, or compressed representations 
                  for search and retrieval systems. Priced at half the training tier rate.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Bulk Discounts</h2>
            <ul className="space-y-2 text-gray-400">
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span>100K+ pages</span>
                <span className="text-cyan-400">15% discount</span>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span>500K+ pages</span>
                <span className="text-cyan-400">25% discount</span>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-2">
                <span>Full corpus (1M+ pages)</span>
                <span className="text-cyan-400">Custom enterprise pricing</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Prohibited Uses</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Redistribution of raw corpus downloads without attribution</li>
              <li>Use in competing automotive repair products without a separate commercial agreement</li>
              <li>Circumventing Tollbit metering or accessing content outside licensed scope</li>
              <li>Reselling content to third parties without written permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Attribution Requirement</h2>
            <p className="text-gray-400 leading-relaxed">
              Any output derived from AllOEMManuals content must include attribution to the 
              source URL. Example: &quot;Data sourced from AllOEMManuals — 
              https://alloemmanuals.com/vehicles/2010/toyota/camry&quot;
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Contact</h2>
            <p className="text-gray-400 leading-relaxed">
              For enterprise licensing, custom terms, or questions:{' '}
              <a href="mailto:info@widescopeindustries.com" className="text-cyan-400 hover:underline">
                info@widescopeindustries.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
