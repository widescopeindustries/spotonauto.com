import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { buildSymptomHref, getSymptomClusterFromText } from '@/data/symptomGraph';
import { VEHICLE_PRODUCTION_YEARS, VALID_TASKS, NOINDEX_MAKES, isNonUsModel, slugifyRoutePart } from '@/data/vehicles';
import { getTier1RescuePagesForTask } from '@/data/rescuePriority';
import { getPriorityCodePagesForTasks, getPrioritySymptomHubsForTasks, getSupportGapRepairsForTasks } from '@/lib/graphPriorityLinks';

function toTitleCase(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function slugify(s: string): string {
  return slugifyRoutePart(s);
}

function taskSlugToSymptom(slug: string): string {
  return decodeURIComponent(slug).replace(/-/g, ' ').trim();
}

interface PageProps {
  params: Promise<{ task: string }>;
}

export async function generateStaticParams() {
  return VALID_TASKS.map((task) => ({ task }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { task } = await params;
  const canonicalTask = slugify(task);
  if (!VALID_TASKS.includes(canonicalTask)) return {};
  const taskName = toTitleCase(canonicalTask);
  return {
    title: `${taskName} Guides for Every Vehicle | SpotOnAuto`,
    description: `Step-by-step ${taskName.toLowerCase()} instructions for Toyota, Honda, Ford, Chevrolet, BMW, and 30+ more makes. Find your exact year, make, and model.`,
    alternates: {
      canonical: `https://spotonauto.com/repairs/${canonicalTask}`,
    },
  };
}

export default async function TaskCategoryPage({ params }: PageProps) {
  const { task } = await params;
  const canonicalTask = slugify(task);
  if (task !== canonicalTask && VALID_TASKS.includes(canonicalTask)) {
    permanentRedirect(`/repairs/${canonicalTask}`);
  }
  if (!VALID_TASKS.includes(canonicalTask)) {
    const symptom = taskSlugToSymptom(task);
    const matchedCluster = getSymptomClusterFromText(symptom);
    if (matchedCluster) {
      permanentRedirect(buildSymptomHref(matchedCluster.slug));
    }
    if (symptom.length > 2) {
      permanentRedirect(`/diagnose?task=${encodeURIComponent(symptom)}`);
    }
    notFound();
  }

  const taskName = toTitleCase(canonicalTask);
  const priorityPages = getTier1RescuePagesForTask(canonicalTask);
  const supportGapPages = getSupportGapRepairsForTasks([canonicalTask], 6)
    .filter((entry) => !priorityPages.some((page) => page.href === entry.href));
  const prioritySymptomHubs = getPrioritySymptomHubsForTasks([canonicalTask], 6);
  const priorityCodePages = getPriorityCodePagesForTasks([canonicalTask], 6);

  // Build vehicle list grouped by make
  const makeGroups: { make: string; vehicles: { year: number; model: string; makeSlug: string; modelSlug: string }[] }[] = [];

  for (const [make, models] of Object.entries(VEHICLE_PRODUCTION_YEARS)) {
    if (NOINDEX_MAKES.has(make.toLowerCase())) continue;

    const makeSlug = slugify(make);
    const vehicles: { year: number; model: string; makeSlug: string; modelSlug: string }[] = [];

    for (const [model, years] of Object.entries(models)) {
      if (isNonUsModel(makeSlug, slugify(model))) continue;
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
      { "@type": "ListItem", position: 3, name: taskName, item: `https://spotonauto.com/repairs/${canonicalTask}` },
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

        {priorityPages.length > 0 && (
          <section className="mb-10 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
            <h2 className="text-xl font-bold text-white mb-2">Popular {taskName} Guides</h2>
            <p className="text-sm text-gray-400 mb-5">
              The most popular {taskName.toLowerCase()} guides with detailed, vehicle-specific instructions.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {priorityPages.map((entry) => (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-cyan-500/40 hover:bg-white/[0.06] transition-all group"
                >
                  <p className="text-xs font-mono uppercase tracking-widest text-cyan-400/80 mb-2">
                    Popular guide
                  </p>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {entry.year} {entry.make} {entry.model}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        {supportGapPages.length > 0 && (
          <section className="mb-10 rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-white">More {taskName} Guides</h2>
                <p className="text-sm text-gray-300 mt-1">
                  Additional vehicle-specific {taskName.toLowerCase()} guides you might find helpful.
                </p>
              </div>
              <Link href="/repair" className="text-sm text-violet-300 hover:text-violet-200 transition-colors">
                Open repair hub →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {supportGapPages.map((entry) => (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-violet-400/40 hover:bg-black/30 transition-all"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-violet-300/80 mb-2">Repair guide</p>
                  <h3 className="text-base font-semibold text-white">{entry.label}</h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        {prioritySymptomHubs.length > 0 && (
          <section className="mb-10 rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-white">Symptoms That May Need {taskName}</h2>
                <p className="text-sm text-gray-300 mt-1">
                  If your car is showing any of these symptoms, a {taskName.toLowerCase()} may be the fix.
                </p>
              </div>
              <Link href="/symptoms" className="text-sm text-amber-300 hover:text-amber-200 transition-colors">
                Browse all symptom hubs →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {prioritySymptomHubs.map((cluster) => (
                <Link
                  key={cluster.href}
                  href={cluster.href}
                  className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-amber-400/35 hover:bg-black/30 transition-all"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80 mb-2">Related symptom</p>
                  <h3 className="text-base font-semibold text-white">{cluster.label}</h3>
                  <p className="text-sm text-gray-300 mt-2">{cluster.summary}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {priorityCodePages.length > 0 && (
          <section className="mb-10 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-white">Trouble Codes Related to {taskName}</h2>
                <p className="text-sm text-gray-300 mt-1">
                  These check engine light codes are often connected to {taskName.toLowerCase()} repairs.
                </p>
              </div>
              <Link href="/codes" className="text-sm text-emerald-300 hover:text-emerald-200 transition-colors">
                Browse all codes →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {priorityCodePages.map((entry) => (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-emerald-400/40 hover:bg-black/30 transition-all"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80 mb-2">{entry.affectedSystem} Code</p>
                  <h3 className="text-base font-semibold text-white">{entry.label}</h3>
                  <p className="text-xs text-gray-400 mt-2">
                    {entry.action}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

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
                  href={`/repair/${v.year}/${v.makeSlug}/${v.modelSlug}/${canonicalTask}`}
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
            {VALID_TASKS.filter(t => t !== canonicalTask).slice(0, 15).map(t => (
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
