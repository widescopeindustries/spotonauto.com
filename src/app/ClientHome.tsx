"use client";

import HeroSection from "./home-sections/HeroSection";
import PopularToolsSection from "./home-sections/PopularToolsSection";
import KitsSection from "./home-sections/KitsSection";
import EntryPathsSection from "./home-sections/EntryPathsSection";
import RepairsSection from "./home-sections/RepairsSection";
import ConversionZone from "@/components/ConversionZone";
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
