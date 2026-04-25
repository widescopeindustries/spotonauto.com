import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import AnalyticsScripts from "@/components/AnalyticsScripts";
import TrackingScript from "@/components/TrackingScript";
import { COMPANY_INFO } from "@/lib/companyInfo";
// SpotOnGuide moved into Providers (client component) for lazy loading

export const metadata: Metadata = {
  metadataBase: new URL('https://spotonauto.com'),
  title: "SpotOnAuto | Free DIY Auto Repair Guides for Your Car",
  description: "Save hundreds on auto repairs. Get instant AI-generated repair guides for your exact vehicle — step-by-step instructions, parts lists, and pro tips. Skip the shop, fix it yourself.",
  keywords: [
    "DIY auto repair",
    "car repair guide",
    "fix car yourself",
    "auto repair instructions",
    "save money car repair",
    "oil change guide",
    "brake replacement guide",
    "serpentine belt diagram",
    "car battery replacement",
    "auto repair near me alternative"
  ],
  openGraph: {
    title: "SpotOnAuto | Skip the Shop. Fix It Yourself.",
    description: "Free AI-powered repair guides for any car. Save $200-500 per repair with step-by-step instructions and parts lists.",
    type: "website",
    url: "https://spotonauto.com",
    siteName: "SpotOnAuto",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpotOnAuto | Free DIY Auto Repair Guides",
    description: "Save hundreds on auto repairs. Instant AI guides for your exact vehicle.",
  },
  other: {
    "fo-verify": "e75768c4-61f2-457f-a6b9-22cc832e8e7f",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#050505] text-gray-200 font-sans antialiased overflow-x-hidden selection:bg-cyan-400 selection:text-black">
        <AnalyticsScripts />

        {/* Organization + WebSite schema — global site identity for Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "@id": "https://spotonauto.com/#organization",
                name: "SpotOnAuto",
                url: "https://spotonauto.com",
                description: "Free AI-powered DIY auto repair guides. OEM-level service data for every vehicle.",
                foundingDate: "2026",
                contactPoint: {
                  "@type": "ContactPoint",
                  url: "https://spotonauto.com/contact",
                  contactType: "Customer Service",
                  telephone: COMPANY_INFO.phoneE164,
                  email: COMPANY_INFO.supportEmail,
                  availableLanguage: ["English"],
                },
                address: {
                  "@type": "PostalAddress",
                  streetAddress: COMPANY_INFO.streetAddress,
                  addressLocality: COMPANY_INFO.city,
                  addressRegion: COMPANY_INFO.state,
                  postalCode: COMPANY_INFO.zip,
                  addressCountry: "US",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "LocalBusiness",
                "@id": "https://spotonauto.com/#localbusiness",
                name: "SpotOnAuto",
                description: "AI-powered automotive repair diagnosis and DIY guides",
                url: "https://spotonauto.com",
                logo: "https://spotonauto.com/logo.png",
                sameAs: [
                  "https://www.facebook.com/spotonauto",
                  "https://www.youtube.com/spotonauto",
                ],
                telephone: COMPANY_INFO.phoneE164,
                email: COMPANY_INFO.supportEmail,
                address: {
                  "@type": "PostalAddress",
                  streetAddress: COMPANY_INFO.streetAddress,
                  addressLocality: COMPANY_INFO.city,
                  addressRegion: COMPANY_INFO.state,
                  postalCode: COMPANY_INFO.zip,
                  addressCountry: "US",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "@id": "https://spotonauto.com/#website",
                name: "SpotOnAuto",
                url: "https://spotonauto.com",
                publisher: { "@id": "https://spotonauto.com/#organization" },
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: "https://spotonauto.com/diagnose?q={search_term_string}",
                  },
                  "query-input": "required name=search_term_string",
                },
              },
            ]),
          }}
        />

        <Providers>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-cyan-500 focus:text-black focus:px-4 focus:py-2 focus:rounded focus:font-bold">
            Skip to main content
          </a>
          <div className="min-h-screen w-full flex flex-col">
            <Header />
            <main id="main-content" role="main" className="flex-grow w-full">
              {children}
            </main>
            <Footer />
          </div>
          {/* SpotOnGuide rendered inside Providers */}
        </Providers>
        <TrackingScript />
      </body>
    </html>
  );
}
