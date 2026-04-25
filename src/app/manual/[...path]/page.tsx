import type { Metadata } from 'next';
import Link from 'next/link';
import {
  fetchCharmPage,
  buildBreadcrumbs,
  buildManualTitle,
  buildManualDescription,
  type CharmLink,
} from '@/lib/charmParser';
import SearchLandingMonetizationRail from '@/components/SearchLandingMonetizationRail';
import SafetyWarningBox from '@/components/SafetyWarningBox';
import RiskAcknowledgementGate from '@/components/RiskAcknowledgementGate';
import WhenToSeeMechanic from '@/components/WhenToSeeMechanic';

export const revalidate = 86400; // 1 day ISR
export const dynamic = 'force-dynamic';

// ─── Types ─────────────────────────────────────────────────────────────────────

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

// ─── Dynamic SEO Metadata ──────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { path } = await params;
  const decodedPath = path.map((s) => safeDecodeSegment(s));

  const title = buildManualTitle(decodedPath);
  const description = buildManualDescription(decodedPath);
  const canonical = 'https://spotonauto.com/manual/' + decodedPath.map(s => encodeURIComponent(s)).join('/');

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
    },
  };
}

// ─── Page Component ────────────────────────────────────────────────────────────

export default async function ManualBrowserPage({ params }: PageProps) {
  const { path } = await params;
  const normalizedPath = path.map((s) => safeDecodeSegment(s));
  const page = await fetchCharmPage(normalizedPath);
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

  // ── Navigation mode ──
  if (page.isNavigation) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <RiskAcknowledgementGate storageKey="spotonauto:risk_ack:guides:v1" />
        <div className="pt-12">
          <Breadcrumbs items={breadcrumbs} />
        </div>
        <SafetyWarningBox className="mb-8" />

        <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-8">
          {page.title}
        </h1>
        <p className="max-w-3xl text-sm sm:text-base text-gray-300 mb-6">
          Use the exact make, year, model, and section below to stay on the OEM answer path for this vehicle.
        </p>

        {/* Cross-sell CTA for 3+ levels deep */}
        {depth >= 3 && <CrossSellCta pathSegments={path} />}

        <SearchLandingMonetizationRail
          surface="manual_page"
          intent="manual"
          contextLabel={page.title}
          className="mb-8 rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-6"
        />

        <nav aria-label="Manual sections">
          <LinkTree links={page.links} depth={depth} />
        </nav>

        {/* Bottom CTA on deeper pages */}
        {depth >= 2 && (
          <div className="mt-12 text-center">
            <Link
              href="/manual"
              className="text-cyan-400 hover:text-cyan-300 font-body text-sm transition-colors"
            >
              &larr; Back to all makes
            </Link>
          </div>
        )}
      </div>
    );
  }

  // ── Content mode (leaf page) ──
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <RiskAcknowledgementGate storageKey="spotonauto:risk_ack:guides:v1" />
      <div className="pt-12">
        <Breadcrumbs items={breadcrumbs} />
      </div>
      <SafetyWarningBox className="mb-8" />

      <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-8">
        {page.title}
      </h1>
      <div className="mb-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.05] p-4 text-sm leading-6 text-gray-300">
        This is the exact OEM manual section for the path above. Use the breadcrumb to move up or down the tree until you reach the precise year, make, model, and subsystem you need.
      </div>

      {/* Cross-sell CTA */}
      {depth >= 3 && <CrossSellCta pathSegments={path} />}

      <SearchLandingMonetizationRail
        surface="manual_page"
        intent="manual"
        contextLabel={page.title}
        className="mb-8 rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-6"
      />

      {/* Rendered content */}
      <article
        className="manual-content glass rounded-2xl p-6 sm:p-8"
        dangerouslySetInnerHTML={{ __html: page.contentHtml }}
      />

      {/* Bottom navigation */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href={breadcrumbs.length >= 3 ? breadcrumbs[breadcrumbs.length - 2].href : '/manual'}
          className="text-cyan-400 hover:text-cyan-300 font-body text-sm transition-colors"
        >
          &larr; Back to {breadcrumbs.length >= 3 ? breadcrumbs[breadcrumbs.length - 2].label : 'all makes'}
        </Link>
        <Link
          href="/manual"
          className="text-gray-500 hover:text-gray-400 font-body text-sm transition-colors"
        >
          All Makes
        </Link>
      </div>
      <WhenToSeeMechanic className="mt-8" />
    </div>
  );
}

// ─── Sub-Components ────────────────────────────────────────────────────────────

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

function LinkTree({ links, depth }: { links: CharmLink[]; depth: number }) {
  if (links.length === 0) {
    return (
      <p className="text-gray-400 py-8 text-center">
        No sections found at this level.
      </p>
    );
  }

  // Choose grid layout based on depth and content type
  const isTopLevel = depth <= 2;

  if (isTopLevel) {
    // Grid layout for makes/years/models
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {links.map((link, i) => {
          if (link.isFolder && link.children) {
            // Folder with children — render as a group
            return (
              <div key={`folder-${i}`} className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5">
                <FolderGroup link={link} />
              </div>
            );
          }

          return (
            <Link
              key={link.href || `link-${i}`}
              href={link.href}
              className="block glass rounded-xl p-4 text-center hover:border-cyan-400/50 transition-all group"
            >
              <span className="text-sm sm:text-base font-display font-bold text-white group-hover:text-cyan-400 transition-colors">
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    );
  }

  // List layout for deeper sections (repair categories, procedures, etc.)
  return (
    <div className="space-y-2">
      {links.map((link, i) => {
        if (link.isFolder && link.children) {
          return <FolderGroup key={`folder-${i}`} link={link} />;
        }

        return (
          <Link
            key={link.href || `link-${i}`}
            href={link.href}
            className="block glass rounded-lg px-5 py-3 hover:border-cyan-400/50 transition-all group"
          >
            <span className="font-body text-gray-200 group-hover:text-cyan-400 transition-colors">
              {link.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function FolderGroup({ link }: { link: CharmLink }) {
  return (
    <div className="glass rounded-xl p-5 mb-3">
      <h3 className="font-display font-bold text-white text-lg mb-3">{link.label}</h3>
      {link.children && link.children.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {link.children.map((child, j) => {
            if (child.isFolder && child.children) {
              return (
                <div key={`child-folder-${j}`} className="col-span-1 sm:col-span-2 md:col-span-3">
                  <FolderGroup link={child} />
                </div>
              );
            }
            return (
              <Link
                key={child.href || `child-${j}`}
                href={child.href}
                className="block rounded-lg bg-white/5 px-4 py-2.5 hover:bg-white/10 hover:text-cyan-400 transition-all text-gray-300 text-sm font-body"
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CrossSellCta({ pathSegments }: { pathSegments: string[] }) {
  // Try to extract year, make, model from the path for a direct repair guide link
  const decoded = pathSegments.map(s => decodeURIComponent(s));
  const make = decoded[0] || '';
  const year = decoded[1] || '';

  // Only show if we have at least make and year
  if (!make || !year) return null;

  // Build a generic repair guide URL
  const makeSlug = make.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="glass rounded-xl p-5 mb-8 border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex-1">
        <p className="font-display font-bold text-white text-sm mb-1">
          Need a step-by-step guide?
        </p>
        <p className="text-gray-400 text-sm font-body">
          Get an AI-powered repair guide with parts lists, cost estimates, and clear instructions for your {year} {make}.
        </p>
      </div>
      <Link
        href={`/guides/${makeSlug}`}
        className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 text-black text-sm font-display font-bold tracking-wider hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
      >
        AI Repair Guides
      </Link>
    </div>
  );
}
