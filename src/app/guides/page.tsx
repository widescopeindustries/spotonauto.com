import React from 'react';
import Link from 'next/link';
import { VEHICLE_PRODUCTION_YEARS } from '@/data/vehicles';
import { FadeInUp, StaggerContainer, StaggerItem } from '@/components/MotionWrappers';

export const metadata = {
  title: 'Repair Guide Directory | Browse by Make | SpotOnAuto',
  description: 'Select your vehicle manufacturer to browse our comprehensive library of AI-powered DIY repair guides.',
};

export default function GuidesPage() {
  const makes = Object.keys(VEHICLE_PRODUCTION_YEARS).sort();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <FadeInUp>
        <h1 className="text-4xl font-display font-bold text-white mb-4">Repair Guide <span className="text-cyan-400">Directory</span></h1>
        <p className="text-gray-400 mb-12 max-w-2xl">
          Select your vehicle manufacturer below to find step-by-step repair instructions, parts lists, and diagnostic advice for your specific model.
        </p>
      </FadeInUp>

      <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {makes.map((make) => (
          <StaggerItem key={make}>
            <Link
              href={`/guides/${make.toLowerCase().replace(/\s+/g, '-')}`}
              className="block glass p-6 text-center hover:border-cyan-400/50 transition-all group"
            >
              <span className="text-xl font-display font-bold text-white group-hover:text-cyan-400 transition-colors">
                {make}
              </span>
            </Link>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}
