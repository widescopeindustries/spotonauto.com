import type { Metadata } from 'next';
import Link from 'next/link';
import { COMPANY_INFO } from '@/lib/companyInfo';

export const metadata: Metadata = {
  title: 'Privacy Policy | AllOEMManuals',
  description: 'How AllOEMManuals collects, uses, and protects your personal information. Covers vehicle data, analytics, affiliate links, cookies, and your privacy rights.',
  alternates: { canonical: 'https://alloemmanuals.com/privacy-policy' },
};

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-gray-300 space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500">Last updated: October 16, 2026</p>
        </div>

        <p>
          AllOEMManuals (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is operated by Widescope Industries LLC, a Service-Disabled
          Veteran-Owned Small Business (SDVOSB). This Privacy Policy describes how we collect, use, and protect your
          information when you visit alloemmanuals.com (the &quot;Site&quot;).
        </p>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-400">1. Information We Collect</h2>

          <h3 className="text-lg font-semibold text-white">Information You Provide</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Vehicle information</strong> — year, make, model, VIN, and diagnostic trouble codes (DTCs) you enter to use our repair guides and diagnostic tools.</li>
            <li><strong>Account data</strong> — if you create a &quot;My Garage&quot; account, we store your email address, saved vehicles, and scan history.</li>
            <li><strong>Contact information</strong> — if you email us at info@widescopeindustries.com or submit feedback.</li>
          </ul>

          <h3 className="text-lg font-semibold text-white">Information Collected Automatically</h3>
          <p className="text-sm">
            Our independent first-party audience measurement counts displayed pages, visible reading time,
            the occurrence of interactions (not their text or contents), affiliate-link clicks, and advertising
            delivery signals. It helps distinguish likely automation from human-consistent activity; it does
            not identify individual people. Random identifiers exist only in the current page&apos;s memory,
            not cookies or browser storage. This measurement does not retain IP addresses, full user-agent
            strings, search queries, or complete outbound URLs. Event records are retained for 30 days.
            We honor Global Privacy Control and Do Not Track for this measurement. Collection is limited
            to the United States unless publisher audience-measurement consent is available through the
            consent platform; an applicable consent or opt-out signal may further limit collection.
            Ordinary hosting/security logs and other analytics services have separate practices described here.
          </p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Analytics</strong> — we use Google Analytics 4 (GA4) to understand how visitors use the Site. This includes pages visited, session duration, device type, browser, approximate geographic location, and traffic source.</li>
            <li><strong>Cookies</strong> — GA4 uses first-party cookies to distinguish unique visitors. Mediavine and our advertising partners may also use cookies for interest-based advertising, as described below.</li>
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
          <h2 className="text-xl font-bold text-cyan-400">3. Advertising &amp; Affiliate Disclosures</h2>
          
          <h3 className="text-lg font-semibold text-white">Mediavine Programmatic Advertising (Ver 1.1)</h3>
          <p className="text-sm">
            The Website works with Mediavine to manage third-party interest-based advertising appearing on the Website. Mediavine serves content and advertisements when you visit the Website, which may use first and third-party cookies. A cookie is a small text file sent to your device by a web server that enables the Website to remember information about your browsing activity.
          </p>
          <p className="text-sm">
            First-party cookies are created by the site you are visiting. A third-party cookie is frequently used in behavioral advertising and analytics and is created by a domain other than the website you are visiting. Third-party cookies, tags, pixels, beacons and other similar technologies (collectively, &quot;Tags&quot;) may be placed on the Website to monitor interaction with advertising content and to target and optimize advertising.
          </p>
          <p className="text-sm">
            For more information about Mediavine, its data collection practices, and how to opt out of interest-based advertising, please visit the <a href="https://www.mediavine.com/privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Mediavine Privacy Policy</a>.
          </p>

          <h3 className="text-lg font-semibold text-white mt-6">Affiliate Programs</h3>
          <p className="text-sm">
            AllOEMManuals participates in affiliate programs with <strong>Amazon Associates</strong>, <strong>PartsGeek</strong> (via CJ Affiliate), <strong>Tire Rack</strong> (via CJ Affiliate), and <strong>TOPDON</strong> (via GoAffPro).
            When you click a product link on our Site and make a purchase, we may earn a commission at no additional cost to you.
            For full details, see our <Link href="/disclosure" className="text-cyan-400 hover:underline">Affiliate Disclosure</Link>.
          </p>
          <p className="text-sm">
            These affiliate partners and ad networks may use cookies to track referral purchases and deliver relevant advertisements. Please review:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><a href="https://www.mediavine.com/privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Mediavine Privacy Policy</a></li>
            <li><a href="https://www.amazon.com/gp/help/customer/display.html?nodeId=468496" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Amazon Privacy Notice</a></li>
            <li><a href="https://www.topdon.us/pages/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">TOPDON Privacy Policy</a></li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-400">4. Factory OEM Technical Data &amp; Verification</h2>
          <p className="text-sm">
            AllOEMManuals provides digital access to factory service manual (OEM) technical specifications, wiring diagrams,
            and diagnostic trouble codes. Where available, pages link to technical reference material in our manual archive.
            Other content can include general repair templates and AI-assisted guidance. Check the source links and confirm
            applicability to your engine and configuration; a model year alone does not establish factory verification.
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
            <li><strong>Delete your account</strong> and all associated data by emailing info@widescopeindustries.com.</li>
            <li><strong>Opt out of analytics</strong> by using a browser extension like Google Analytics Opt-out.</li>
            <li><strong>Request your data</strong> — email us and we will provide a copy of any personal data we hold about you within 30 days.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-cyan-400">7. Children&apos;s Privacy</h2>
          <p className="text-sm">
            AllOEMManuals is not directed at children under 13. We do not knowingly collect personal information from children.
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
            <strong>{COMPANY_INFO.legalName}</strong><br />
            {COMPANY_INFO.streetAddress}<br />
            {COMPANY_INFO.city}, {COMPANY_INFO.state} {COMPANY_INFO.zip}<br />
            Phone: <a href={COMPANY_INFO.phoneTel} className="text-cyan-400 hover:underline">{COMPANY_INFO.phoneDisplay}</a><br />
            Email: <a href={`mailto:${COMPANY_INFO.supportEmail}`} className="text-cyan-400 hover:underline">{COMPANY_INFO.supportEmail}</a><br />
            Business hours: {COMPANY_INFO.businessHours}
          </p>
        </section>
      </div>
    </main>
  );
}
