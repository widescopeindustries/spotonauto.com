import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import AnalyticsScripts from "@/components/AnalyticsScripts";
import Ga4PageView from "@/components/Ga4PageView";
import TrackingScript from "@/components/TrackingScript";
import AmazonOneLink from "@/components/AmazonOneLink";
import AmazonGeoRedirect from "@/components/AmazonGeoRedirect";
import { COMPANY_INFO } from "@/lib/companyInfo";
import { GA_MEASUREMENT_ID } from "@/lib/ga";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL('https://alloemmanuals.com'),
  title: "AllOEMManuals | Free DIY Auto Repair Guides for Your Car",
  description: "Free factory service manual data for your exact vehicle. Step-by-step repair procedures, torque specs, DTC codes, and wiring diagrams used by professional technicians.",
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
    title: "AllOEMManuals | Skip the Shop. Fix It Yourself.",
    description: "Free factory-data repair guides for any vehicle. OEM torque specs, DTC codes, fluid capacities, and step-by-step procedures.",
    type: "website",
    url: "https://alloemmanuals.com",
    siteName: "AllOEMManuals",
  },
  twitter: {
    card: "summary_large_image",
    title: "AllOEMManuals | Free DIY Auto Repair Guides",
    description: "Save hundreds on auto repairs. Factory service data for your exact vehicle.",
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AllOEMManuals',
  },
  other: {
    "fo-verify": "b3487b75-b248-4d32-9c11-5746d7d02087",
    "google-adsense-account": "ca-pub-3105584943212740",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script defer data-cfasync="false" src="/audience-ledger.js?v=20261016" />
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
        <script
          id="ga4"
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}',{send_page_view:true});`,
          }}
        />
        {/* Mediavine Script Wrapper */}
        <script
          type="text/javascript"
          async
          data-noptimize="1"
          data-cfasync="false"
          src="//scripts.mediavine.com/tags/64b496ca-b6f8-40ae-b329-c276001da62e.js"
        />

        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLMs.txt — AI crawler context for AllOEMManuals" />
        <meta name="ai-license" content="https://alloemmanuals.com/license" />
        <meta name="google-adsense-account" content="ca-pub-3105584943212740" />
        <meta name='impact-site-verification' {...({ value: '39ff62d6-58f8-468a-80a0-5a794bd799fc' } as any)} />
        <Script
          id="impact-cdn"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `(function(i,m,p,a,c,t){c.ire_o=p;c[p]=c[p]||function(){(c[p].a=c[p].a||[]).push(arguments)};t=a.createElement(m);var z=a.getElementsByTagName(m)[0];t.async=1;t.src=i;z.parentNode.insertBefore(t,z)})('https://utt.impactcdn.com/P-A7329204-a09d-47c6-b03e-929ff1738bb31.js','script','impactStat',document,window);impactStat('transformLinks');impactStat('trackImpression');`
          }}
        />
        <Script
          id="model-context"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `if('modelContext' in navigator){try{navigator.modelContext.provideContext({name:'alloemmanuals',tools:[{name:'getRepairGuide',description:'Get a vehicle-specific repair guide.',inputSchema:{type:'object',properties:{year:{type:'integer'},make:{type:'string'},model:{type:'string'},task:{type:'string'}},required:['year','make','model','task']},execute:async(i)=>{const r=await fetch('https://alloemmanuals.com/api/v1/repair?year='+i.year+'&make='+i.make+'&model='+i.model+'&task='+i.task);return r.json();}},{name:'getDTCInfo',description:'Look up diagnostic trouble code.',inputSchema:{type:'object',properties:{code:{type:'string'}},required:['code']},execute:async(i)=>{const r=await fetch('https://alloemmanuals.com/api/graph/dtc/'+encodeURIComponent(i.code));return r.json();}}]});}catch(e){}}`
          }}
        />
      </head>
      <body className={`bg-[#0B0F17] text-slate-200 font-sans antialiased overflow-x-hidden selection:bg-sky-500/30 selection:text-sky-200 ${inter.variable} ${spaceGrotesk.variable}`}>
          <div className="hidden" aria-hidden="true">
            Impact-Site-Verification: a22a6f24-e23a-49ea-845e-4bb3c9358673
          </div>
          <AnalyticsScripts />
          <Suspense fallback={null}>
            <Ga4PageView />
          </Suspense>

        {/* Organization + WebSite schema — global site identity for Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                "@id": "https://alloemmanuals.com/#organization",
                name: "AllOEMManuals",
                url: "https://alloemmanuals.com",
                description: "Free DIY auto repair guides backed by factory service manual data for every vehicle.",
                foundingDate: "2026",
                contactPoint: {
                  "@type": "ContactPoint",
                  url: "https://alloemmanuals.com/contact",
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
                "@id": "https://alloemmanuals.com/#localbusiness",
                name: "AllOEMManuals",
                description: "Free OEM repair guides, DTC codes, wiring diagrams, and torque specs for your exact year, make, and model — backed by factory service manual data.",
                url: "https://alloemmanuals.com",
                logo: "https://alloemmanuals.com/logo.png",
                sameAs: [
                  "https://www.youtube.com/@alloemmanuals",
                  "https://widescopeindustries.com",
                  "https://whattypeofoil.com",
                  "https://whattiresfitmy.com",
                  "https://whatwipersfitmy.com",
                  "https://whatbulbfitsmy.com",
                  COMPANY_INFO.googleReviewUrl.replace('/review', ''),
                ],
                priceRange: "$$",
                telephone: COMPANY_INFO.phoneE164,
                email: COMPANY_INFO.supportEmail,
                openingHoursSpecification: {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                  opens: "09:00",
                  closes: "17:00",
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
                "@type": "WebSite",
                "@id": "https://alloemmanuals.com/#website",
                name: "AllOEMManuals",
                url: "https://alloemmanuals.com",
                publisher: { "@id": "https://alloemmanuals.com/#organization" },
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: "https://alloemmanuals.com/diagnose?q={search_term_string}",
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
        <AmazonOneLink />
        <AmazonGeoRedirect />
      </body>
    </html>
  );
}
