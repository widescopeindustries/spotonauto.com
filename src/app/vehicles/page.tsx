import { Metadata } from 'next';
import Link from 'next/link';
import {
  VEHICLE_PRODUCTION_YEARS,
  slugifyRoutePart,
} from '@/data/vehicles';
import VehicleSelectorClient from './VehicleSelectorClient';

export const metadata: Metadata = {
  title: 'Vehicle Selector — Find Your Factory Manual & Repair Guides | AllOEMManuals',
  description:
    'Select your year, make, and model to access factory service manuals, diagnostic trouble codes, wiring diagrams, and step-by-step repair guides.',
  alternates: { canonical: 'https://alloemmanuals.com/vehicles' },
};

export const revalidate = 86400; // 24 hour ISR

interface MakeOption {
  slug: string;
  label: string;
}

interface ModelOption {
  slug: string;
  label: string;
  startYear: number;
  endYear: number;
}

export default function VehiclesIndexPage() {
  const makes: MakeOption[] = Object.keys(VEHICLE_PRODUCTION_YEARS)
    .sort()
    .map((make) => ({
      slug: slugifyRoutePart(make),
      label: make,
    }));

  const modelsByMake: Record<string, ModelOption[]> = {};
  for (const [make, models] of Object.entries(VEHICLE_PRODUCTION_YEARS)) {
    const makeSlug = slugifyRoutePart(make);
    modelsByMake[makeSlug] = Object.entries(models)
      .map(([model, years]) => ({
        slug: slugifyRoutePart(model),
        label: model,
        startYear: years.start,
        endYear: years.end,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  const allModelOptions: Array<{
    makeSlug: string;
    makeLabel: string;
    modelSlug: string;
    modelLabel: string;
    startYear: number;
    endYear: number;
  }> = [];

  for (const [make, models] of Object.entries(VEHICLE_PRODUCTION_YEARS)) {
    const makeSlug = slugifyRoutePart(make);
    for (const [model, years] of Object.entries(models)) {
      allModelOptions.push({
        makeSlug,
        makeLabel: make,
        modelSlug: slugifyRoutePart(model),
        modelLabel: model,
        startYear: years.start,
        endYear: years.end,
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <section className="py-12 px-4 max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-cyan-400 transition">
            Home
          </Link>
          <span>/</span>
          <span className="text-white">Vehicles</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Find Your Vehicle
          </h1>
          <p className="text-gray-400 max-w-2xl">
            Select your year, make, and model to access the complete factory
            service manual, diagnostic trouble codes, wiring diagrams, and
            step-by-step repair guides.
          </p>
        </div>

        {/* Interactive selector */}
        <VehicleSelectorClient
          makes={makes}
          modelsByMake={modelsByMake}
          allModelOptions={allModelOptions}
        />

        {/* Quick links to popular makes */}
        <section className="mt-16">
          <h2 className="text-lg font-bold text-white mb-4">
            Popular Makes
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              'Toyota',
              'Honda',
              'Ford',
              'Chevrolet',
              'Nissan',
              'BMW',
              'Jeep',
              'Hyundai',
              'Subaru',
              'Volkswagen',
              'Mercedes',
              'Audi',
            ].map((make) => {
              const slug = slugifyRoutePart(make);
              const hasData = VEHICLE_PRODUCTION_YEARS[make];
              if (!hasData) return null;
              return (
                <Link
                  key={slug}
                  href={`/guides/${slug}`}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm text-gray-300 hover:bg-white/[0.06] hover:text-white hover:border-white/20 transition"
                >
                  {make}
                </Link>
              );
            })}
          </div>
        </section>
      </section>
    </div>
  );
}
