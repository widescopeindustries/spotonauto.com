"use client";

import HeroSection from "./home-sections/HeroSection";
import EntryPathsSection from "./home-sections/EntryPathsSection";
import ConversionZone from "@/components/ConversionZone";

export default function ClientHome() {
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#EAEAEA]">
      <HeroSection />
      <EntryPathsSection />
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <ConversionZone vehicleLabel="your vehicle" intentLabel="homepage" />
      </section>
    </div>
  );
}
