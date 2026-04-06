import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Affiliate Disclosure | SpotOnAuto',
  description: 'FTC-compliant affiliate disclosure for SpotOnAuto. How we earn revenue through Amazon Associates, TOPDON affiliate program, and Google AdSense while keeping all repair content free.',
  alternates: { canonical: 'https://spotonauto.com/disclosure' },
};

export default function AffiliateDisclosure() {
  return (
    <main className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-gray-300 space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Affiliate Disclosure</h1>
          <p className="text-sm text-gray-500">Last updated: April 2, 2026</p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 text-sm">
          <p className="text-amber-200 font-semibold mb-2">In the interest of full transparency:</p>
          <p className="text-amber-100/80">
            SpotOnAuto (operated by Widescope Industries LLC) earns money through affiliate commissions and advertising.
            Some links on this website are affiliate links, meaning we may earn a commission if you click through and make
            a purchase — <strong>at no additional cost to you</strong>. This is how we keep the site free and continue
            building tools for the DIY auto repair community.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-400">How We Make Money</h2>
          <p className="text-sm">SpotOnAuto is a free website. We do not charge users for repair guides, diagnostic tools, wiring diagrams, or any other content. We earn revenue through the following channels:</p>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-white">1. Amazon Associates Program</h3>
          <p className="text-sm">
            SpotOnAuto is a participant in the <strong>Amazon Services LLC Associates Program</strong>, an affiliate
            advertising program designed to provide a means for sites to earn advertising fees by advertising and linking
            to Amazon.com.
          </p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>When our repair guides recommend parts (oil filters, brake pads, spark plugs, etc.), we link to those parts on Amazon.</li>
            <li>If you click an Amazon link on our Site and purchase anything within 24 hours — even items we did not link to — we may earn a small commission (typically 1–4% depending on the product category).</li>
            <li>Amazon affiliate links on our Site are identified by our Associates tag: <code className="text-cyan-400">aiautorepair-20</code>.</li>
            <li>Prices shown are provided by Amazon and may change. We do not control Amazon&apos;s pricing.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-white">2. TOPDON Affiliate Program</h3>
          <p className="text-sm">
            SpotOnAuto is an affiliate partner with <strong>TOPDON</strong> (topdon.us), a manufacturer of OBD2 diagnostic
            scanners and battery testers, through the GoAffPro affiliate platform.
          </p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>We earn a <strong>5% commission</strong> on TOPDON products purchased through our referral links.</li>
            <li>TOPDON product recommendations appear on our DTC code pages, live diagnostic tool, and dedicated comparison guides (e.g., <Link href="/tools/best-topdon-scanner" className="text-cyan-400 hover:underline">Best TOPDON Scanner</Link>).</li>
            <li>We recommend TOPDON products because we believe they offer good value for DIY mechanics. Our product recommendations are based on the diagnostic context (what code you&apos;re reading, what system you&apos;re diagnosing) — not commission rates.</li>
            <li>TOPDON referral links on our Site use the referral code: <code className="text-cyan-400">spoton</code>.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-white">3. Google AdSense</h3>
          <p className="text-sm">
            We display advertisements on some pages through <strong>Google AdSense</strong>. These ads are served by Google
            and may be personalized based on your browsing history (per Google&apos;s ad personalization settings). We earn
            revenue when visitors view or click these ads.
          </p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Ad placements are clearly distinguished from our editorial content.</li>
            <li>We do not control which ads Google displays on our pages.</li>
            <li>You can manage your Google ad personalization settings at <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">adssettings.google.com</a>.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-400">What This Means for You</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-green-400 mt-0.5 shrink-0">&#10003;</span>
              <p><strong>You never pay more.</strong> Affiliate commissions come from the retailer, not from you. The price you pay is exactly the same whether you use our link or go directly to the store.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-400 mt-0.5 shrink-0">&#10003;</span>
              <p><strong>Our content is not influenced by commissions.</strong> Repair guides are generated from OEM factory service manual data and AI. We recommend the right part for the job, not the part that pays us the most.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-400 mt-0.5 shrink-0">&#10003;</span>
              <p><strong>Product recommendations match your diagnostic context.</strong> When you look up a DTC code, we recommend the scanner tier that actually reads that code — not the most expensive option.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-400 mt-0.5 shrink-0">&#10003;</span>
              <p><strong>We only partner with products we stand behind.</strong> We chose Amazon because most DIYers already trust and use it. We chose TOPDON because their scanners offer strong value at each price point for the DIY community.</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-400">FTC Compliance</h2>
          <p className="text-sm">
            This disclosure is provided in accordance with the Federal Trade Commission&apos;s (FTC){' '}
            <a href="https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Endorsement Guides</a>.
            The FTC requires that affiliate relationships be clearly disclosed to consumers. We are committed to
            transparency and will always identify affiliate links and sponsored content on our Site.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-400">About Us</h2>
          <p className="text-sm">
            SpotOnAuto is a DBA of <strong>Widescope Industries LLC</strong>, a Service-Disabled Veteran-Owned Small Business
            (SDVOSB) certified through the U.S. Small Business Administration. We are a real, registered U.S. business
            committed to providing honest, useful automotive repair information to the DIY community.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-400">Questions?</h2>
          <p className="text-sm">
            If you have any questions about our affiliate relationships or how we earn revenue, contact us at:<br />
            <a href="mailto:support@spotonauto.com" className="text-cyan-400 hover:underline">support@spotonauto.com</a>
          </p>
        </section>
      </div>
    </main>
  );
}
