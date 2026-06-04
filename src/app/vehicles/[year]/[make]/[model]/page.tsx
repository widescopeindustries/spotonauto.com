import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { buildVehicleLaneData } from '@/lib/vehicleLane';
import { slugifyRoutePart, VEHICLE_PRODUCTION_YEARS } from '@/data/vehicles';
import { canonicalizeVehicleIdentity } from '@/lib/vehicleIdentity';
import { getProfilesForVehicle } from '@/lib/vehicleRepairProfiles';
import { getToolPagesForVehicle, TOOL_TYPE_META, getConciseQuickAnswer } from '@/data/tools-pages';
import VehicleLaneClient from './VehicleLaneClient';

/**
 * Detect variant-slug URLs like /vehicles/2011/ford/ranger-2d-pickup-extra-cab
 * and redirect to the clean hub format /vehicles/{year}/{make}/{model}/.
 * Google is discovering these corpus variant paths and wasting crawl budget.
 */
function resolveCleanModelSlug(make: string, incomingModelSlug: string): string | null {
  const makeNormalized = decodeURIComponent(make).trim();
  const models = VEHICLE_PRODUCTION_YEARS[makeNormalized];
  if (!models) return null;

  const incoming = slugifyRoutePart(incomingModelSlug);
  let bestMatch: string | null = null;
  let bestLength = 0;

  for (const modelName of Object.keys(models)) {
    const modelSlug = slugifyRoutePart(modelName);
    if (!modelSlug) continue;

    // Exact match — no redirect needed
    if (modelSlug === incoming) return null;

    // Prefix match: model slug must be followed by hyphen or comma in the incoming slug
    if (
      incoming.startsWith(modelSlug) &&
      (incoming.length === modelSlug.length || /[-,]/.test(incoming[modelSlug.length]))
    ) {
      if (modelSlug.length > bestLength) {
        bestLength = modelSlug.length;
        bestMatch = modelSlug;
      }
    }
  }

  return bestMatch;
}

export const revalidate = 21600; // 6 hour ISR

interface PageProps {
  params: Promise<{ year: string; make: string; model: string }>;
}

/** Build a concise specs snippet from tool pages for titles and descriptions. */
function buildSpecsSnippet(year: number, toolPages: ReturnType<typeof getToolPagesForVehicle>): string {
  if (toolPages.length === 0) return '';
  const priority: string[] = ['oil-type', 'coolant-type', 'fluid-capacity', 'battery-location', 'tire-size', 'transmission-fluid-type', 'spark-plug-type', 'wiper-blade-size', 'headlight-bulb'];
  const ordered = priority
    .map((type) => toolPages.find((p) => p.toolType === type))
    .filter(Boolean) as typeof toolPages;
  const extras = toolPages.filter((p) => !priority.includes(p.toolType));
  const picks = [...ordered, ...extras].slice(0, 3);
  const snippets = picks
    .map((p) => getConciseQuickAnswer(year, p))
    .filter(Boolean) as string[];
  // Hard cap: each snippet ≤40 chars, total ≤80 chars
  const capped = snippets.map((s) => (s.length > 40 ? s.slice(0, 39) + '…' : s));
  const joined = capped.join(' · ');
  return joined.length > 80 ? joined.slice(0, 79) + '…' : joined;
}

/** Build a topic keyword snippet for title tags (e.g. "Oil Type, Coolant & Battery") */
function buildTopicKeywordSnippet(toolPages: ReturnType<typeof getToolPagesForVehicle>): string {
  if (toolPages.length === 0) return '';
  const topicMap: Record<string, string> = {
    'oil-type': 'Oil Type',
    'coolant-type': 'Coolant',
    'fluid-capacity': 'Fluid Capacity',
    'battery-location': 'Battery',
    'tire-size': 'Tire Size',
    'transmission-fluid-type': 'Transmission Fluid',
    'spark-plug-type': 'Spark Plugs',
    'wiper-blade-size': 'Wiper Blades',
    'headlight-bulb': 'Headlight Bulb',
    'serpentine-belt': 'Serpentine Belt',
    'brake-fluid-type': 'Brake Fluid',
  };
  const priority: string[] = ['oil-type', 'coolant-type', 'battery-location', 'tire-size', 'serpentine-belt', 'wiper-blade-size', 'transmission-fluid-type', 'spark-plug-type', 'brake-fluid-type', 'headlight-bulb', 'fluid-capacity'];
  const ordered = priority
    .map((type) => toolPages.find((p) => p.toolType === type))
    .filter(Boolean) as typeof toolPages;
  const topics = ordered.slice(0, 3).map((p) => topicMap[p.toolType]).filter(Boolean);
  if (topics.length === 0) return '';
  if (topics.length === 1) return topics[0];
  if (topics.length === 2) return `${topics[0]} & ${topics[1]}`;
  return `${topics[0]}, ${topics[1]} & ${topics[2]}`;
}

function humanizeTask(slug: string): string {
  return slug
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { year, make, model } = await params;
  const identity = canonicalizeVehicleIdentity({
    year,
    make: decodeURIComponent(make),
    model: decodeURIComponent(model),
  });
  const vehicleLabel = `${identity.year} ${identity.displayMake} ${identity.displayModel}`;
  const pageUrl = `https://alloemmanuals.com/vehicles/${year}/${make}/${model}`;

  const yearNum = parseInt(year, 10);
  const toolPages = getToolPagesForVehicle(identity.make, identity.model);
  const specsSnippet = buildSpecsSnippet(yearNum, toolPages);

  // Load repair profiles for a more specific fallback title
  const repairProfiles = await getProfilesForVehicle(yearNum, identity.make, identity.model);
  const topRepairTasks = repairProfiles.slice(0, 4).map((p) => humanizeTask(p.task));

  const topicSnippet = buildTopicKeywordSnippet(toolPages);

  let title: string;
  let description: string;

  if (topicSnippet) {
    title = `${vehicleLabel} ${topicSnippet} & Factory Specs | AllOEMManuals`;
  } else if (topRepairTasks.length > 0) {
    const tasksText = topRepairTasks.length > 2
      ? `${topRepairTasks.slice(0, 2).join(', ')} & More`
      : topRepairTasks.join(', ');
    title = `${vehicleLabel} ${tasksText} | AllOEMManuals`;
  } else {
    title = `${vehicleLabel} Repair Guides, DTC Codes & Factory Specs | AllOEMManuals`;
  }

  if (specsSnippet) {
    description = `${vehicleLabel} specs: ${specsSnippet}. Exact OEM oil type, coolant, battery size, tire pressure, and more from the factory service manual. Plus DTC codes, wiring diagrams, and step-by-step repair guides.`;
  } else if (topRepairTasks.length > 0) {
    description = `DIY repair hub for the ${vehicleLabel}. Step-by-step guides for ${topRepairTasks.join(', ')}, and more. Factory diagnostic trouble codes, wiring diagrams, torque specs, and maintenance schedules.`;
  } else {
    description = `DIY repair hub for the ${vehicleLabel}. Factory diagnostic trouble codes, wiring diagrams, torque specs, maintenance schedules, and step-by-step repair guides.`;
  }

  return {
    title,
    description,
    openGraph: { title, description, type: 'article', url: pageUrl },
    alternates: { canonical: pageUrl },
  };
}

export default async function VehicleLanePage({ params }: PageProps) {
  const { year, make, model } = await params;
  const yearNum = parseInt(year, 10);
  if (isNaN(yearNum) || yearNum < 1982 || yearNum > 2025) notFound();

  // Redirect variant-slug URLs to clean hub format
  const cleanModelSlug = resolveCleanModelSlug(make, model);
  if (cleanModelSlug && cleanModelSlug !== slugifyRoutePart(model)) {
    redirect(`/vehicles/${yearNum}/${slugifyRoutePart(make)}/${cleanModelSlug}`);
  }

  // We don't 404 when DB data is missing — the hub still has repair profiles,
  // maintenance links, and AI diagnosis even without factory manual sections.
  let data: Awaited<ReturnType<typeof buildVehicleLaneData>> = null;
  try {
    data = await buildVehicleLaneData(make, yearNum, model);
  } catch (err) {
    console.warn(`[vehicleLane] DB unavailable for ${yearNum} ${make} ${model}`, err);
  }
  const identity = canonicalizeVehicleIdentity({ year: String(yearNum), make, model });
  const displayName = `${identity.year} ${identity.displayMake} ${identity.displayModel}`;
  const basePath = `/vehicles/${year}/${slugifyRoutePart(make)}/${slugifyRoutePart(model)}`;
  const repairPath = `/repair/${year}/${identity.makeSlug}/${identity.modelSlug}`;

  // Load generated repair profiles for this exact vehicle
  const repairProfiles = await getProfilesForVehicle(yearNum, identity.make, identity.model);

  // Load corpus tool pages for this vehicle (oil-type, tire-size, etc.)
  const toolPages = getToolPagesForVehicle(identity.make, identity.model);

  // Filter out generic template text so SERP snippets stay clean
  const cleanToolPages = toolPages.map((p) => ({
    slug: p.slug,
    title: p.title,
    toolType: p.toolType,
    quickAnswer: getConciseQuickAnswer(yearNum, p) || '',
  })).filter((p) => p.quickAnswer.length > 0);

  // Top DTCs for server-rendered snippet
  const topDtcs = (data?.dtcCodes ?? []).slice(0, 6);

  // Top repair profiles for server-rendered snippet
  const topRepairs = repairProfiles.slice(0, 5);

  // Tool types that have vehicle-specific maintenance pages (link hub cards here instead of generic /tools/)
  const MAINTENANCE_TOOL_TYPES = new Set(['oil-type', 'coolant-type', 'tire-size', 'battery-location', 'wiper-blade-size', 'serpentine-belt', 'brake-fluid-type', 'transmission-fluid-type', 'spark-plug-type', 'headlight-bulb']);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://alloemmanuals.com' },
              { '@type': 'ListItem', position: 2, name: 'Vehicles', item: 'https://alloemmanuals.com/vehicles' },
              { '@type': 'ListItem', position: 3, name: identity.displayMake, item: `https://alloemmanuals.com/vehicles/${year}/${slugifyRoutePart(make)}` },
              { '@type': 'ListItem', position: 4, name: displayName, item: `https://alloemmanuals.com/vehicles/${year}/${slugifyRoutePart(make)}/${slugifyRoutePart(model)}` },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: `${displayName} Repair Hub`,
            about: {
              '@type': 'Vehicle',
              name: displayName,
              manufacturer: { '@type': 'Organization', name: identity.displayMake },
              model: identity.displayModel,
              productionDate: year,
              ...(identity.displayVariant
                ? { vehicleEngine: { '@type': 'EngineSpecification', name: identity.displayVariant } }
                : {}),
            },
            url: `https://alloemmanuals.com/vehicles/${year}/${slugifyRoutePart(make)}/${slugifyRoutePart(model)}`,
          }),
        }}
      />
      <section className="py-12 px-4 max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-cyan-400 transition">Home</Link>
          <span>/</span>
          <Link href="/vehicles" className="hover:text-cyan-400 transition">Vehicles</Link>
          <span>/</span>
          <span className="text-white">{displayName}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-1">{displayName}</h1>
          <p className="text-gray-500 text-sm">{identity.displayVariant || identity.displayModel}</p>
        </div>

        {/* ── SERVER-RENDERED Quick Specs Card ── */}
        {toolPages.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 mb-8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Factory Specs at a Glance
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {toolPages.slice(0, 6).map((tp) => {
                const meta = TOOL_TYPE_META[tp.toolType];
                const concise = getConciseQuickAnswer(yearNum, tp);
                // Skip cards with no real data — generic text poisons SERP snippets
                if (!concise) return null;
                const maintPath = `/maintenance/${year}/${identity.makeSlug}/${identity.modelSlug}/${tp.toolType}`;
                const href = MAINTENANCE_TOOL_TYPES.has(tp.toolType) ? maintPath : `/tools/${tp.slug}`;
                return (
                  <Link
                    key={tp.slug}
                    href={href}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 hover:border-cyan-500/30 hover:bg-cyan-500/[0.04] transition"
                  >
                    <span className="text-xl shrink-0">{meta?.icon ?? '🔧'}</span>
                    <div className="min-w-0">
                      <div className="text-xs text-gray-500">{meta?.label ?? tp.toolType}</div>
                      <div className="text-sm font-medium text-white truncate">{concise}</div>
                    </div>
                  </Link>
                );
              }).filter(Boolean)}
            </div>
          </div>
        )}

        {/* ── SERVER-RENDERED Top DTCs ── */}
        {topDtcs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Common Diagnostic Codes
            </h2>
            <div className="flex flex-wrap gap-2">
              {topDtcs.map((dtc) => (
                <Link
                  key={dtc.code}
                  href={`/codes/${dtc.code.toLowerCase()}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm hover:bg-amber-500/20 transition"
                >
                  <span className="font-mono font-semibold">{dtc.code}</span>
                  <span className="text-gray-400 text-xs truncate max-w-[200px]">{dtc.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── SERVER-RENDERED Top Repairs ── */}
        {topRepairs.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Popular Repairs
            </h2>
            <div className="flex flex-wrap gap-2">
              {topRepairs.map((r) => (
                <Link
                  key={r.task}
                  href={`${repairPath}/${r.task}`}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm hover:bg-cyan-500/20 transition"
                >
                  {r.profile.supportNote?.title || r.task.replace(/-/g, ' ')}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Interactive deep-dive (client-side) ── */}
        <VehicleLaneClient
          displayName={displayName}
          basePath={basePath}
          repairPath={repairPath}
          diagnosePath={`/diagnose?year=${year}&make=${encodeURIComponent(identity.make)}&model=${encodeURIComponent(identity.model)}`}
          dtcCodes={data?.dtcCodes.map((d) => ({
            code: d.code,
            title: d.title,
            system: d.system,
          })) || []}
          systems={data?.systems.map((s) => ({
            name: s.name,
            slug: s.slug,
            dtcCount: s.dtcCount,
            procedureCount: s.procedureCount,
            diagramCount: s.diagramCount,
            totalCount: s.totalCount,
          })) || []}
          graph={data?.graph}
          repairProfiles={repairProfiles.map((p) => ({
            task: p.task,
            title: p.profile.supportNote?.title || p.task.replace(/-/g, ' '),
          }))}
          toolPages={cleanToolPages}
        />

        {/* Cross-links */}
        <div className="flex flex-wrap gap-3 border-t border-white/10 pt-8">
          <Link
            href={repairPath}
            className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm hover:bg-cyan-500/20 transition"
          >
            DIY Repair Guides
          </Link>
          <Link
            href={`/manual/${encodeURIComponent(identity.make)}/${year}`}
            className="px-4 py-2 rounded-lg bg-slate-500/10 border border-slate-500/20 text-slate-300 text-sm hover:bg-slate-500/20 transition"
          >
            Browse Full Factory Manual
          </Link>
        </div>
      </section>
    </div>
  );
}
