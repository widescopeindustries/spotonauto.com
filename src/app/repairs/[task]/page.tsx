import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { VEHICLE_PRODUCTION_YEARS, VALID_TASKS, NOINDEX_MAKES } from '@/data/vehicles';

function toTitleCase(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '-');
}

interface PageProps {
  params: Promise<{ task: string }>;
}

export async function generateStaticParams() {
  return VALID_TASKS.map((task) => ({ task }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { task } = await params;
  if (!VALID_TASKS.includes(task)) return {};
  const taskName = toTitleCase(task);
  return {
    title: `${taskName} Guides for Every Vehicle | SpotOnAuto`,
    description: `Step-by-step ${taskName.toLowerCase()} instructions for Toyota, Honda, Ford, Chevrolet, BMW, and 30+ more makes. Find your exact year, make, and model.`,
    alternates: {
      canonical: `https://spotonauto.com/repairs/${task}`,
    },
  };
}

export default async function TaskCategoryPage({ params }: PageProps) {
  const { task } = await params;
  if (!VALID_TASKS.includes(task)) notFound();

  const taskName = toTitleCase(task);

  // Build vehicle list grouped by make
  const makeGroups: { make: string; vehicles: { year: number; model: string; makeSlug: string; modelSlug: string }[] }[] = [];

  for (const [make, models] of Object.entries(VEHICLE_PRODUCTION_YEARS)) {
    if (NOINDEX_MAKES.has(make.toLowerCase())) continue;

    const makeSlug = slugify(make);
    const vehicles: { year: number; model: string; makeSlug: string; modelSlug: string }[] = [];

    for (const [model, years] of Object.entries(models)) {
      // Pick a representative year: 2013 if in range (charm.li sweet spot), else latest
      const targetYear = years.end >= 2013 && years.start <= 2013 ? 2013 : years.end;
      vehicles.push({
        year: targetYear,
        model,
        makeSlug,
        modelSlug: slugify(model),
      });
    }

    vehicles.sort((a, b) => a.model.localeCompare(b.model));
    makeGroups.push({ make, vehicles });
  }

  makeGroups.sort((a, b) => a.make.localeCompare(b.make));

  const totalVehicles = makeGroups.reduce((sum, g) => sum + g.vehicles.length, 0);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://spotonauto.com" },
      { "@type": "ListItem", position: 2, name: "Repairs", item: "https://spotonauto.com/repairs" },
      { "@type": "ListItem", position: 3, name: taskName, item: `https://spotonauto.com/repairs/${task}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/repairs" className="hover:text-cyan-400 transition-colors">Repairs</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-300">{taskName}</span>
        </nav>

        <h1 className="text-4xl font-display font-bold text-white mb-4">
          <span className="text-cyan-400">{taskName}</span> Guides
        </h1>
        <p className="text-gray-400 mb-10 max-w-3xl">
          Step-by-step {taskName.toLowerCase()} instructions for {totalVehicles}+ vehicles.
          Select your make and model below for a guide tailored to your exact car, truck, or SUV —
          including tools, parts, torque specs, and safety warnings from factory service manuals.
        </p>

        {makeGroups.map(({ make, vehicles }) => (
          <section key={make} className="mb-10" id={slugify(make)}>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              {make}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {vehicles.map((v) => (
                <Link
                  key={`${v.makeSlug}-${v.modelSlug}`}
                  href={`/repair/${v.year}/${v.makeSlug}/${v.modelSlug}/${task}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.06] transition-all group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/60 flex-shrink-0" />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    {v.year} {make} {v.model}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}

        {/* Quick-jump nav for makes */}
        <nav className="mt-12 pt-8 border-t border-white/10">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Jump to Make</h3>
          <div className="flex flex-wrap gap-2">
            {makeGroups.map(({ make }) => (
              <a
                key={make}
                href={`#${slugify(make)}`}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
              >
                {make}
              </a>
            ))}
          </div>
        </nav>

        {/* Cross-link to other repair categories */}
        <section className="mt-12 pt-8 border-t border-white/10">
          <h3 className="text-lg font-bold text-white mb-4">Other Repair Categories</h3>
          <div className="flex flex-wrap gap-2">
            {VALID_TASKS.filter(t => t !== task).slice(0, 15).map(t => (
              <Link
                key={t}
                href={`/repairs/${t}`}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all capitalize"
              >
                {toTitleCase(t)}
              </Link>
            ))}
            <Link
              href="/repairs"
              className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-400 hover:bg-cyan-500/20 transition-all"
            >
              View All Categories
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
