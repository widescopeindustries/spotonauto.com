import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  title: "SpotOn Auto | AI Auto Repair & Parts Comparison",
  description: "AI-powered auto repair diagnostics. Get step-by-step repair guides and compare parts prices from Amazon, RockAuto, and AutoZone. Trusted by 50,000+ DIY mechanics.",
  keywords: ["auto repair", "car parts", "DIY mechanic", "brake pads", "oil change", "car diagnostics"],
  openGraph: {
    title: "SpotOn Auto | AI Auto Repair",
    description: "Instant AI diagnostics and parts price comparison from Amazon, RockAuto, and AutoZone.",
    type: "website",
    url: "https://spotonauto.com",
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
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400..900&family=Share+Tech+Mono&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-brand-black text-gray-200 font-sans antialiased overflow-x-hidden selection:bg-neon-cyan selection:text-black">
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

        <AuthProvider>
          <div className="min-h-screen w-full flex flex-col bg-black">
            <Header />
            <main className="flex-grow w-full">
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
