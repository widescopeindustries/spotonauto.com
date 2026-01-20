import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "AI Auto Repair | Instant Diagnostics",
  description: "AI Auto Repair Guide. Instant diagnostics and repair instructions.",
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
