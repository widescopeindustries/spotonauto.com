import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  buildBreadcrumbs,
  buildManualTitle,
  buildManualDescription,
  type CharmLink,
} from '@/lib/charmParser';
import { fetchManualPage, getSectionByPath, getChildSections } from '@/lib/manualService';
import { isBoilerplateManualPath, isBoilerplateManualStoredPath } from '@/lib/manualBoilerplate';
import WorkshopManualViewer from '@/components/manual/WorkshopManualViewer';
import SearchLandingMonetizationRail from '@/components/SearchLandingMonetizationRail';
import SafetyWarningBox from '@/components/SafetyWarningBox';
import RiskAcknowledgementGate from '@/components/RiskAcknowledgementGate';
import WhenToSeeMechanic from '@/components/WhenToSeeMechanic';

export const revalidate = 86400;

interface PageProps {
  params: Promise<{ path: string[] }>;
}

function safeDecodeSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { path } = await params;
  const decodedPath = path.map((s) => safeDecodeSegment(s));
  if (decodedPath.some((s) => s.toLowerCase() === 'hyperlink') || isBoilerplateManualPath(decodedPath)) {
    notFound();
  }
  const title = buildManualTitle(decodedPath);
  const description = buildManualDescription(decodedPath);
  const canonical = 'https://alloemmanuals.com/manual/' + decodedPath.map(s => encodeURIComponent(s)).join('/');
  const isHyperlink = decodedPath.some((s) => s.toLowerCase() === 'hyperlink');

  return {
    title,
    description,
    alternates: { canonical },
    robots: isHyperlink ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
    },
  };
}

function getParentPath(segments: string[]): string | null {
  if (segments.length <= 1) return null;
  const parentSegments = segments.slice(0, -1);
  return '/' + parentSegments.map((s) => encodeURIComponent(s)).join('/');
}

function getVehicleLabel(segments: string[]): string {
  if (segments.length >= 3) {
    const make = segments[0];
    const year = segments[1];
    const model = segments[2];
    return `${year} ${make} ${model}`;
  }
  if (segments.length === 2) return `${segments[1]} ${segments[0]}`;
  if (segments.length === 1) return segments[0];
  return 'Service Manual';
}

export default async function ManualBrowserPage({ params }: PageProps) {
  const { path } = await params;
  const normalizedPath = path.map((s) => safeDecodeSegment(s));

  // Kill the /manual/hyperlink/ crawl trap: malformed legacy CHARM URLs that
  // concatenate path segments infinitely. Hard 404 so Google drops them.
  if (normalizedPath.some((s) => s.toLowerCase() === 'hyperlink')) {
    notFound();
  }
  if (isBoilerplateManualPath(normalizedPath)) {
    notFound();
  }

  const dbPath = '/' + normalizedPath.map((s) => encodeURIComponent(s)).join('/');
  const page = await fetchManualPage(normalizedPath);
  const breadcrumbs = buildBreadcrumbs(normalizedPath);
  const depth = path.length;

  // ── Error state: emit true HTTP 404 to eliminate Google Soft 404 penalty ──
  if (page.status !== 200) {
    notFound();
  }

  // ── Fetch related sections for JARVIS viewer ──
  const parentPath = getParentPath(normalizedPath);
  const [parentSection, siblingSections, childSections] = await Promise.all([
    parentPath ? getSectionByPath(parentPath).catch(() => null) : Promise.resolve(null),
    parentPath ? getChildSections(parentPath).catch(() => []) : Promise.resolve([]),
    getChildSections(dbPath).catch(() => []),
  ]);
  const visibleSiblings = siblingSections.filter((s) => !isBoilerplateManualStoredPath(s.path));
  const visibleChildren = childSections.filter((s) => !isBoilerplateManualStoredPath(s.path));

  const parent = parentSection
    ? {
        id: parentSection.path,
        title: parentSection.sectionTitle || 'Parent Section',
        path: '/manual' + parentSection.path.split('/').map(encodeURIComponent).join('/'),
        type: 'parent' as const,
      }
    : undefined;

  const siblings = visibleSiblings
    .filter((s) => s.path !== dbPath)
    .map((s) => ({
      id: s.path,
      title: s.sectionTitle || s.path.split('/').pop() || 'Section',
      path: '/manual' + s.path.split('/').map(encodeURIComponent).join('/'),
      type: 'sibling' as const,
      preview: s.contentPreview?.slice(0, 80) + '...',
    }));

  const children = visibleChildren.map((s) => ({
    id: s.path,
    title: s.sectionTitle || s.path.split('/').pop() || 'Section',
    path: '/manual' + s.path.split('/').map(encodeURIComponent).join('/'),
    type: 'child' as const,
  }));

  const navLinks = page.links.map((link) => ({
    label: link.label,
    href: link.href,
  }));

  // ── Render JARVIS viewer ──
  return (
    <>
      <RiskAcknowledgementGate storageKey="spotonauto:risk_ack:guides:v1" />
      <SafetyWarningBox className="mb-6" />
      <WorkshopManualViewer
        title={page.title}
        vehicle={getVehicleLabel(normalizedPath)}
        contentHtml={page.contentHtml}
        breadcrumbs={breadcrumbs}
        parent={parent}
        siblings={siblings}
        childSections={children}
        isNavigation={page.isNavigation}
        navLinks={navLinks}
        vehicleInfo={
          normalizedPath.length >= 3
            ? {
                make: normalizedPath[0],
                year: normalizedPath[1],
                model: normalizedPath[2],
              }
            : {}
        }
      />
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <SearchLandingMonetizationRail
          surface="manual_page"
          intent="manual"
          contextLabel={page.title}
          className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-6"
          compact
        />
        <WhenToSeeMechanic className="mt-8" />
      </div>
    </>
  );
}

function Breadcrumbs({ items }: { items: { label: string; href: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm font-body">
        {items.map((item, i) => (
          <li key={item.href} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-gray-600">/</span>}
            {i === items.length - 1 ? (
              <span className="text-gray-400">{item.label}</span>
            ) : (
              <Link href={item.href} className="text-cyan-400 hover:text-cyan-300 transition-colors">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
