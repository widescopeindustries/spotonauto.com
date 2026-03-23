import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import KnowledgeGraphGroup from '@/components/KnowledgeGraphGroup';
import { buildSymptomHref, getSymptomClusterBySlug, getSymptomClusterFromText, SYMPTOM_CLUSTERS } from '@/data/symptomGraph';
import { getPriorityCodePagesForSymptomCluster, getSupportGapRepairsForTasks } from '@/lib/graphPriorityLinks';
import { buildSymptomNodeId } from '@/lib/knowledgeGraph';
import { buildKnowledgeGraphExport } from '@/lib/knowledgeGraphExport';
import { rankKnowledgeGraphBlocks } from '@/lib/knowledgeGraphRanking';
import { buildSymptomHubGraph } from '@/lib/symptomHubGraph';

interface PageProps {
  params: Promise<{ symptom: string }>;
}

function toDiagnosisHref(label: string): string {
  return `/diagnose?task=${encodeURIComponent(label)}`;
}

export async function generateStaticParams() {
  return SYMPTOM_CLUSTERS.map((cluster) => ({ symptom: cluster.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { symptom } = await params;
  const cluster = getSymptomClusterBySlug(symptom) || getSymptomClusterFromText(symptom);

  if (!cluster) {
    return {
      title: 'Symptom Hub Not Found | SpotOnAuto',
      description: 'Browse graph-driven vehicle symptom hubs on SpotOnAuto.',
    };
  }

  return {
    title: `${cluster.label} | Symptom Hub, Repairs, Codes & Vehicle Paths`,
    description: `${cluster.label} symptom hub with likely repair categories, related code pages, and exact vehicle workflows tied together by the SpotOnAuto knowledge graph.`,
    alternates: {
      canonical: `https://spotonauto.com${buildSymptomHref(cluster.slug)}`,
    },
  };
}

export default async function SymptomHubPage({ params }: PageProps) {
  const { symptom } = await params;
  const directCluster = getSymptomClusterBySlug(symptom);
  const matchedCluster = directCluster || getSymptomClusterFromText(symptom);

  if (!matchedCluster) notFound();
  if (!directCluster || directCluster.slug !== matchedCluster.slug) {
    permanentRedirect(buildSymptomHref(matchedCluster.slug));
  }

  const symptomHub = buildSymptomHubGraph(matchedCluster);
  const priorityCodePages = getPriorityCodePagesForSymptomCluster(matchedCluster, 6);
  const supportGapRepairs = getSupportGapRepairsForTasks(matchedCluster.likelyTasks, 6);
  const rankedKnowledgeGroups = rankKnowledgeGraphBlocks('symptom', symptomHub.groups, {
    task: matchedCluster.likelyTasks[0],
    query: `${matchedCluster.label} ${matchedCluster.likelyTasks.join(' ')}`.trim(),
  });
  const knowledgeGraphExport = buildKnowledgeGraphExport({
    surface: 'symptom',
    rootNodeId: buildSymptomNodeId(matchedCluster.slug),
    rootKind: 'symptom',
    rootLabel: matchedCluster.label,
    blocks: rankedKnowledgeGroups.map((group) => ({
      kind: group.kind,
      title: group.title,
      browseHref: group.browseHref,
      nodes: group.nodes.map((node) => ({
        nodeId: node.nodeId,
        edgeId: node.edgeId,
        sourceNodeId: node.sourceNodeId,
        targetNodeId: node.targetNodeId,
        vehicleNodeId: node.vehicleNodeId,
        taskNodeId: node.taskNodeId,
        systemNodeId: node.systemNodeId,
        codeNodeId: node.codeNodeId,
        href: node.href,
        label: node.label,
        description: node.description,
        badge: node.badge,
        targetKind: node.kind,
      })),
    })),
  });

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://spotonauto.com' },
      { '@type': 'ListItem', position: 2, name: 'Symptoms', item: 'https://spotonauto.com/symptoms' },
      { '@type': 'ListItem', position: 3, name: matchedCluster.label, item: `https://spotonauto.com${buildSymptomHref(matchedCluster.slug)}` },
    ],
  };

  const faqItems = [
    {
      question: `What does the "${matchedCluster.label}" symptom hub do?`,
      answer: `It maps a plain-English complaint into the most likely repair categories, related trouble code pages, and exact vehicle repair paths that commonly connect to this symptom.`,
    },
    {
      question: `Should I start with diagnosis or a repair page for ${matchedCluster.label.toLowerCase()}?`,
      answer: `Start with diagnosis if you have not confirmed the failed part yet. Use the repair-category links when you already know the likely repair family and want to drill down faster.`,
    },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script
        id="knowledge-graph-export"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(knowledgeGraphExport) }}
      />

      <section className="max-w-6xl mx-auto px-4 pt-12 pb-10">
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/symptoms" className="hover:text-cyan-400 transition-colors">Symptoms</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-300">{matchedCluster.label}</span>
        </nav>

        <p className="text-amber-300 text-xs uppercase tracking-[0.2em] font-bold mb-3">Canonical Symptom Cluster</p>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
          {matchedCluster.label} <span className="text-amber-400">Symptom Hub</span>
        </h1>
        <p className="text-lg text-gray-300 max-w-3xl">
          {matchedCluster.summary}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
          <StatCard label="Repair categories" value={String(symptomHub.repairCount)} />
          <StatCard label="Related codes" value={String(symptomHub.codeCount)} />
          <StatCard label="Exact vehicle paths" value={String(symptomHub.vehicleCount)} />
          <StatCard label="Systems" value={String(matchedCluster.systems.length)} />
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <Link
            href={toDiagnosisHref(matchedCluster.label)}
            className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5 hover:border-cyan-400/45 transition-all"
          >
            <h2 className="text-lg font-semibold text-white">Run diagnosis from this symptom</h2>
            <p className="text-sm text-gray-300 mt-2">Carry this complaint straight into the AI diagnostic flow with the symptom prefilled.</p>
          </Link>
          <Link
            href="/repair"
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-amber-400/35 transition-all"
          >
            <h2 className="text-lg font-semibold text-white">Open repair hub</h2>
            <p className="text-sm text-gray-300 mt-2">Step back into the broader repair graph if you want to browse by category or vehicle first.</p>
          </Link>
          <Link
            href="/codes"
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-amber-400/35 transition-all"
          >
            <h2 className="text-lg font-semibold text-white">Search code pages</h2>
            <p className="text-sm text-gray-300 mt-2">Use code pages when this symptom has already triggered a warning light or stored trouble code.</p>
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {matchedCluster.systems.map((system) => (
            <span
              key={system}
              className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-amber-200"
            >
              {system}
            </span>
          ))}
        </div>
      </section>

      {rankedKnowledgeGroups.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-14">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold text-white">Graph paths from this symptom</h2>
            <p className="text-gray-400 mt-2">
              These links are generated from the canonical symptom cluster, not from one-off page copy.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {rankedKnowledgeGroups.map((group) => (
              <KnowledgeGraphGroup
                key={group.kind}
                surface="symptom"
                groupKind={group.kind}
                title={group.title}
                browseHref={group.browseHref}
                theme={group.theme}
                nodes={group.nodes.map((node) => ({
                  ...node,
                  targetKind: node.kind,
                }))}
                context={{ task: matchedCluster.slug }}
              />
            ))}
          </div>
        </section>
      )}

      {priorityCodePages.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-14">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold text-white">Priority code pages this symptom should reinforce</h2>
              <p className="text-gray-300 mt-2">
                These code pages are still light on inbound support. Linking them from the canonical symptom hub helps push more authority into the code-to-repair path.
              </p>
            </div>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
              {priorityCodePages.map((entry) => (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-emerald-400/40 hover:bg-black/30 transition-all"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80 mb-2">{entry.affectedSystem} Code</p>
                  <h3 className="text-base font-semibold text-white">{entry.label}</h3>
                  <p className="text-xs text-gray-400 mt-2">{entry.action}</p>
                  <p className="text-xs text-gray-500 mt-1">Opportunity score {entry.opportunityScore}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {supportGapRepairs.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-14">
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.06] p-6">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold text-white">Priority exact repair pages this symptom should support</h2>
              <p className="text-gray-300 mt-2">
                The graph-priority report says these repair pages match this symptom family but still need stronger inbound support.
              </p>
            </div>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
              {supportGapRepairs.map((entry) => (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className="rounded-xl border border-white/10 bg-black/20 p-4 hover:border-violet-400/40 hover:bg-black/30 transition-all"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-violet-300/80 mb-2">Support Gap</p>
                  <h3 className="text-base font-semibold text-white">{entry.label}</h3>
                  <p className="text-xs text-gray-400 mt-2">Opportunity score {entry.opportunityScore}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Drivers also describe this as</h2>
          <div className="flex flex-wrap gap-2">
            {matchedCluster.aliases.map((alias) => (
              <span
                key={alias}
                className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-sm text-gray-300"
              >
                {alias}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
    </div>
  );
}
