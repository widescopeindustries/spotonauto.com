"use client";

import dynamic from "next/dynamic";
import HeroSection from "./home-sections/HeroSection";

const PopularToolsSection = dynamic(() => import("./home-sections/PopularToolsSection"), {
  ssr: false,
  loading: () => <div className="h-96 bg-[#0a0a0c]" />,
});

const KitsSection = dynamic(() => import("./home-sections/KitsSection"), {
  ssr: false,
  loading: () => <div className="h-96 bg-[#0a0a0c]" />,
});

const EntryPathsSection = dynamic(() => import("./home-sections/EntryPathsSection"), {
  ssr: false,
  loading: () => <div className="h-96 bg-[#0a0a0c]" />,
});

const RepairsSection = dynamic(() => import("./home-sections/RepairsSection"), {
  ssr: false,
  loading: () => <div className="h-96 bg-[#0a0a0c]" />,
});

const ConversionZone = dynamic(() => import("@/components/ConversionZone"), {
  ssr: false,
});

import { TIER_1_RESCUE_PAGES } from "@/data/rescuePriority";

export default function ClientHome() {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#EAEAEA]">
      <HeroSection />
      <PopularToolsSection />
      <KitsSection />
      <EntryPathsSection />
      <RepairsSection
        repairs={TIER_1_RESCUE_PAGES.map((p) => ({
          href: p.href,
          label: `${p.year} ${p.make} ${p.model} ${p.task.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
        }))}
      />
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <ConversionZone vehicleLabel="your vehicle" intentLabel="homepage" />
      </section>
    </div>
  );
}
