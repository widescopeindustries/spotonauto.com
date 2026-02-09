import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { VEHICLE_PRODUCTION_YEARS, VALID_TASKS } from '@/data/vehicles';
import { FadeInUp, StaggerContainer, StaggerItem } from '@/components/MotionWrappers';
import { Wrench } from 'lucide-react';

interface PageProps {
  params: Promise<{
    make: string;
    model: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { make, model } = await params;
  const displayMake = make.charAt(0).toUpperCase() + make.slice(1).replace(/-/g, ' ');
  const displayModel = model.charAt(0).toUpperCase() + model.slice(1).replace(/-/g, ' ');
  return {
    title: `${displayMake} ${displayModel} DIY Repair Guides | SpotOnAuto`,
    description: `Complete step-by-step DIY repair guides for the ${displayMake} ${displayModel}. Fix common issues yourself and save.`,
  };
}

export default async function ModelGuidesPage({ params }: PageProps) {
  const { make, model } = await params;
  
  // Find matching make in our data
  const originalMake = Object.keys(VEHICLE_PRODUCTION_YEARS).find(
    m => m.toLowerCase().replace(/\s+/g, '-') === make.toLowerCase()
  );

  if (!originalMake) notFound();

  // Find matching model
  const originalModel = Object.keys(VEHICLE_PRODUCTION_YEARS[originalMake]).find(
    m => m.toLowerCase().replace(/\s+/g, '-') === model.toLowerCase()
  );

  if (!originalModel) notFound();

  const production = VEHICLE_PRODUCTION_YEARS[originalMake][originalModel];
  
  // We'll link to 2013 as a representative year or the latest year available in our sitemap range
  const targetYear = Math.min(2013, production.end);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <FadeInUp>
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/guides/${make}`} className="text-cyan-400 hover:underline">← Back to {originalMake}</Link>
        </div>
        <h1 className="text-4xl font-display font-bold text-white mb-4">
          <span className="text-cyan-400">{originalMake} {originalModel}</span> Guides
        </h1>
        <p className="text-gray-400 mb-12 max-w-2xl">
          Comprehensive DIY maintenance and repair guides for the {originalMake} {originalModel} ({production.start} - {production.end}).
        </p>
      </FadeInUp>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {VALID_TASKS.map((task) => (
          <StaggerItem key={task}>
            <Link
              href={`/repair/${targetYear}/${make}/${model}/${task}`}
              className="flex items-center gap-4 glass p-6 hover:border-cyan-400/50 transition-all group"
            >
              <div className="p-3 bg-cyan-500/10 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                <Wrench className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors capitalize">
                  {task.replace(/-/g, ' ')}
                </h3>
                <p className="text-sm text-gray-500">Step-by-step guide & parts list</p>
              </div>
            </Link>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}
