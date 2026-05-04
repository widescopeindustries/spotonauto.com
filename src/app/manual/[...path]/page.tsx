import type { Metadata } from 'next';
import Link from 'next/link';
import {
  buildBreadcrumbs,
  buildManualTitle,
  buildManualDescription,
  type CharmLink,
} from '@/lib/charmParser';
import { fetchManualPage, getSectionByPath, getChildSections } from '@/lib/manualService';
import JarvisManualViewer from '@/components/manual/JarvisManualViewer';
import SearchLandingMonetizationRail from '@/components/SearchLandingMonetizationRail';
import SafetyWarningBox from '@/components/SafetyWarningBox';
import RiskAcknowledgementGate from '@/components/RiskAcknowledgementGate';
import WhenToSeeMechanic from '@/components/WhenToSeeMechanic';

export const revalidate = 86400;
export const dynamic = 'force-dynamic';

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
  const title = buildManualTitle(decodedPath);
  const description = buildManualDescription(decodedPath);
  const canonical = 'https://spotonauto.com/manual/' + decodedPath.map(s => encodeURIComponent(s)).join('/');
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
  const dbPath = '/' + normalizedPath.map((s) => encodeURIComponent(s)).join('/');
  const page = await fetchManualPage(normalizedPath);
  const breadcrumbs = buildBreadcrumbs(normalizedPath);
  const depth = path.length;

  // ── Error state ──
  if (page.status !== 200) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24">
        <RiskAcknowledgementGate storageKey="spotonauto:risk_ack:guides:v1" />
        <SafetyWarningBox className="mb-6" />
        <Breadcrumbs items={breadcrumbs} />
        <div className="text-center py-16">
          <h1 className="text-4xl font-display font-bold text-white mb-4">Page Not Found</h1>
          <p className="text-gray-400 text-lg mb-8">
            {page.status === 404
              ? 'This service manual page could not be found. The path may have changed or the vehicle may not be in our database.'
              : `Something went wrong loading this page (error ${page.status}). Please try again in a few minutes.`}
          </p>
          <Link
            href="/manual"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-display font-bold tracking-wider hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
          >
            Back to All Makes
          </Link>
        </div>
      </div>
    );
  }

  // ── Fetch related sections for JARVIS viewer ──
  const parentPath = getParentPath(normalizedPath);
  const [parentSection, siblingSections, childSections] = await Promise.all([
    parentPath ? getSectionByPath(parentPath).catch(() => null) : Promise.resolve(null),
    parentPath ? getChildSections(parentPath).catch(() => []) : Promise.resolve([]),
    getChildSections(dbPath).catch(() => []),
  ]);

  const parent = parentSection
    ? {
        id: parentSection.path,
        title: parentSection.sectionTitle || 'Parent Section',
        path: '/manual' + parentSection.path.split('/').map(encodeURIComponent).join('/'),
        type: 'parent' as const,
      }
    : undefined;

  const siblings = siblingSections
    .filter((s) => s.path !== dbPath)
    .map((s) => ({
      id: s.path,
      title: s.sectionTitle || s.path.split('/').pop() || 'Section',
      path: '/manual' + s.path.split('/').map(encodeURIComponent).join('/'),
      type: 'sibling' as const,
      preview: s.contentPreview?.slice(0, 80) + '...',
    }));

  const children = childSections.map((s) => ({
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
      <JarvisManualViewer
        title={page.title}
        vehicle={getVehicleLabel(normalizedPath)}
        contentHtml={page.contentHtml}
        breadcrumbs={breadcrumbs}
        parent={parent}
        siblings={siblings}
        childSections={children}
        isNavigation={page.isNavigation}
        navLinks={navLinks}
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
