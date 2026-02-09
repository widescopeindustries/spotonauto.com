import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#050505] text-gray-200 font-sans antialiased overflow-x-hidden selection:bg-cyan-400 selection:text-black">
        {/* Google Analytics */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}

        <Providers>
          <div className="min-h-screen w-full flex flex-col">
            <Header />
            <main className="flex-grow w-full">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
