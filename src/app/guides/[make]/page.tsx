import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { VEHICLE_PRODUCTION_YEARS } from '@/data/vehicles';
import { FadeInUp, StaggerContainer, StaggerItem } from '@/components/MotionWrappers';

interface PageProps {
  params: Promise<{
    make: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { make } = await params;
  const displayName = make.charAt(0).toUpperCase() + make.slice(1).replace(/-/g, ' ');
  return {
    title: `${displayName} Repair Guides | SpotOnAuto`,
    description: `Browse DIY repair guides for ${displayName} vehicles. Step-by-step instructions for maintenance and repairs.`,
  };
}

export default async function MakeGuidesPage({ params }: PageProps) {
  const { make } = await params;
  
  // Find matching make in our data
  const originalMake = Object.keys(VEHICLE_PRODUCTION_YEARS).find(
    m => m.toLowerCase().replace(/\s+/g, '-') === make.toLowerCase()
  );

  if (!originalMake) {
    notFound();
  }

  const models = Object.keys(VEHICLE_PRODUCTION_YEARS[originalMake]).sort();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <FadeInUp>
        <div className="flex items-center gap-4 mb-8">
          <Link href="/guides" className="text-cyan-400 hover:underline">← Back to Directory</Link>
        </div>
        <h1 className="text-4xl font-display font-bold text-white mb-4">
          <span className="text-cyan-400">{originalMake}</span> Repair Guides
        </h1>
        <p className="text-gray-400 mb-12 max-w-2xl">
          Select your {originalMake} model to view available repair and maintenance guides.
        </p>
      </FadeInUp>

      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {models.map((model) => (
          <StaggerItem key={model}>
            <Link
              href={`/guides/${make}/${model.toLowerCase().replace(/\s+/g, '-')}`}
              className="block glass p-6 hover:border-cyan-400/50 transition-all group"
            >
              <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                {model}
              </h3>
              <p className="text-xs text-gray-500 mt-2 uppercase tracking-widest font-mono">
                View Guides →
              </p>
            </Link>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}
