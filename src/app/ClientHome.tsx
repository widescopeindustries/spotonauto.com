'use client';

import HeroSection from './home-sections/HeroSection';
import DiagnosticSection from './home-sections/DiagnosticSection';
import RepairsSection from './home-sections/RepairsSection';
import DTCCodeSection from './home-sections/DTCCodeSection';
import GarageSection from './home-sections/GarageSection';
import ConversionZone from '@/components/ConversionZone';

export default function ClientHome() {
  return (
    <div className="bg-[#050507] min-h-screen text-[#EAEAEA]">
      <HeroSection />
      <DiagnosticSection />
      <RepairsSection />
      <DTCCodeSection />
      <GarageSection />
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <ConversionZone
          vehicleLabel="your vehicle"
          intentLabel="homepage"
        />
      </section>
    </div>
  );
}
