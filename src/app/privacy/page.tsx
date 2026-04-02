import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | SpotOnAuto',
  description: 'How SpotOnAuto collects, uses, and protects your personal information. Covers vehicle data, analytics, affiliate links, and your rights.',
  alternates: { canonical: 'https://spotonauto.com/privacy' },
};

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-gray-300 space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500">Last updated: April 2, 2026</p>
        </div>

        <p>
          SpotOnAuto (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is operated by Widescope Industries LLC, a Service-Disabled
          Veteran-Owned Small Business (SDVOSB). This Privacy Policy describes how we collect, use, and protect your
          information when you visit spotonauto.com (the &quot;Site&quot;).
        </p>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-400">1. Information We Collect</h2>

          <h3 className="text-lg font-semibold text-white">Information You Provide</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Vehicle information</strong> — year, make, model, VIN, and diagnostic trouble codes (DTCs) you enter to use our repair guides and diagnostic tools.</li>
            <li><strong>Account data</strong> — if you create a &quot;My Garage&quot; account, we store your email address, saved vehicles, and scan history.</li>
            <li><strong>Contact information</strong> — if you email us at support@spotonauto.com or submit feedback.</li>
          </ul>

          <h3 className="text-lg font-semibold text-white">Information Collected Automatically</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Analytics</strong> — we use Google Analytics 4 (GA4) to understand how visitors use the Site. This includes pages visited, session duration, device type, browser, approximate geographic location, and traffic source. We have implemented a 3-second engagement delay and webdriver detection to filter automated bot traffic.</li>
            <li><strong>Cookies</strong> — GA4 uses first-party cookies to distinguish unique visitors. We do not use tracking cookies for advertising purposes.</li>
            <li><strong>Ahrefs Web Analytics</strong> — we use Ahrefs for supplemental, privacy-friendly website analytics. Ahrefs does not use cookies and does not track personal data.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-400">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>To generate personalized repair guides, diagnostic results, and parts recommendations for your vehicle.</li>
            <li>To improve the Site, fix bugs, and understand which content is most useful.</li>
            <li>To display contextually relevant product recommendations (see Affiliate Disclosure below).</li>
            <li>To respond to support inquiries.</li>
          </ul>
          <p className="text-sm"><strong>We do not sell, rent, or share your personal data with third parties for their marketing purposes.</strong></p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-400">3. Affiliate Links &amp; Third-Party Services</h2>
          <p className="text-sm">
            SpotOnAuto participates in affiliate programs with <strong>Amazon Associates</strong> and <strong>TOPDON</strong> (via GoAffPro).
            When you click a product link on our Site and make a purchase, we may earn a commission at no additional cost to you.
            For full details, see our <Link href="/disclosure" className="text-cyan-400 hover:underline">Affiliate Disclosure</Link>.
          </p>
          <p className="text-sm">
            These affiliate partners may use cookies to track that a purchase originated from our Site. We do not control their
            cookie policies. Please review:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><a href="https://www.amazon.com/gp/help/customer/display.html?nodeId=468496" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Amazon Privacy Notice</a></li>
            <li><a href="https://www.topdon.us/pages/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">TOPDON Privacy Policy</a></li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-400">4. AI-Generated Content</h2>
          <p className="text-sm">
            Some content on SpotOnAuto is generated using artificial intelligence (Google Gemini). When we have factory service manual
            (OEM) data for your vehicle (model years 1982–2013), our AI uses that data as its source and the page displays an
            &quot;OEM Verified&quot; badge. For vehicles outside our corpus coverage (2014 and newer), content is AI-generated and clearly
            labeled as such. We never represent AI-generated content as OEM data.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-400">5. Data Security</h2>
          <p className="text-sm">
            We use HTTPS encryption on all pages, store data in secured databases (Supabase with row-level security),
            and follow OWASP security practices. However, no method of electronic transmission or storage is 100% secure,
            and we cannot guarantee absolute security.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-400">6. Your Rights</h2>
          <p className="text-sm">You may:</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Delete your account</strong> and all associated data by emailing support@spotonauto.com.</li>
            <li><strong>Opt out of analytics</strong> by using a browser extension like Google Analytics Opt-out or enabling Do Not Track.</li>
            <li><strong>Request your data</strong> — email us and we will provide a copy of any personal data we hold about you within 30 days.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-400">7. Children&apos;s Privacy</h2>
          <p className="text-sm">
            SpotOnAuto is not directed at children under 13. We do not knowingly collect personal information from children.
            If you believe a child has provided us with personal data, please contact us and we will delete it.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-400">8. Changes to This Policy</h2>
          <p className="text-sm">
            We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated &quot;Last
            updated&quot; date. Continued use of the Site after changes constitutes acceptance.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-400">9. Contact</h2>
          <p className="text-sm">
            If you have questions about this Privacy Policy or your data, contact us at:<br />
            <strong>Widescope Industries LLC</strong><br />
            Email: <a href="mailto:support@spotonauto.com" className="text-cyan-400 hover:underline">support@spotonauto.com</a>
          </p>
        </section>
      </div>
    </main>
  );
}
