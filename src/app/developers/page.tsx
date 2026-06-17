import { Metadata } from 'next';
import Link from 'next/link';
import {
  Code,
  Webhook,
  Database,
  Zap,
  Shield,
  Globe,
  Terminal,
  Check,
  ArrowRight,
  Lock,
  Cpu,
  Car,
} from 'lucide-react';
import { ReactNode } from 'react';
import CopyButton from './CopyButton';

export const metadata: Metadata = {
  title: 'AllOEMManuals AI Training Feed — API for LLMs',
  description:
    'Factory repair data for 300K+ vehicles, served as clean markdown for AI training and agents. Pay per page with x402. No affiliate links, no HTML parsing.',
  alternates: { canonical: 'https://alloemmanuals.com/developers' },
  openGraph: {
    title: 'AllOEMManuals AI Training Feed — Factory Data for LLMs',
    description:
      'Structured OEM repair data, DTC diagnostics, and wiring diagrams for AI training and agent consumption. Clean markdown. Pay per page.',
    url: 'https://alloemmanuals.com/developers',
    siteName: 'AllOEMManuals',
    type: 'website',
  },
};

/* ─────────────── Data ─────────────── */

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/data/{year}/{make}/{model}[/{section}]',
    auth: 'x402',
    desc: 'AI Training Feed — clean markdown vehicle data. No affiliates, no HTML. Sections: repairs/{task}, dtc, specs.',
    example:
      'curl -H "Accept: text/markdown" -H "Authorization: Bearer $X402_TOKEN" "https://alloemmanuals.com/api/data/2010/toyota/camry"',
  },
  {
    method: 'GET',
    path: '/api/v1/repair',
    auth: 'none',
    desc: 'Repair guide with steps, tools, parts, and torque specs.',
    example:
      'curl "https://alloemmanuals.com/api/v1/repair?year=2013&make=bmw&model=x3&task=oil-change"',
  },
  {
    method: 'GET',
    path: '/api/premium-repair-data',
    auth: 'x402',
    desc: 'Full OEM excerpts + knowledge graph + generated profiles (JSON).',
    example:
      'curl -H "Authorization: Bearer $X402_TOKEN" "https://alloemmanuals.com/api/premium-repair-data?year=2010&make=toyota&model=camry&task=brake-pad-replacement"',
  },
  {
    method: 'GET',
    path: '/api/graph/dtc/{code}',
    auth: 'none',
    desc: 'Diagnostic trouble code lookup with graph-linked procedures.',
    example:
      'curl "https://alloemmanuals.com/api/graph/dtc/P0420"',
  },
  {
    method: 'GET',
    path: '/api/graph/diagnose',
    auth: 'none',
    desc: 'Neo4j-powered diagnosis by DTC + year/make/model.',
    example:
      'curl "https://alloemmanuals.com/api/graph/diagnose?dtc=P0171&year=2012&make=ford&model=focus"',
  },
];

const FEATURES = [
  {
    icon: Database,
    title: '300K+ Vehicles',
    desc: 'CHARM (1982–2014) + LEMON (1960–2025). Every response is vehicle-specific. No generic fluff.',
  },
  {
    icon: Code,
    title: 'Clean Markdown',
    desc: 'No HTML parsing. No affiliate links. No ads or navigation. Structured markdown built for LLM ingestion and RAG.',
  },
  {
    icon: Shield,
    title: 'x402 Micropayments',
    desc: 'Pay per page with Solana USDC. $0.01/page, dropping to $0.005 at volume, $0.001 at scale. No subscriptions.',
  },
  {
    icon: Globe,
    title: 'Agent-Native Discovery',
    desc: 'OpenAPI with x-payment-info, MCP server card, ACP/UCP, and RFC 9727 api-catalog. AI agents and crawlers find you.',
  },
  {
    icon: Cpu,
    title: 'Knowledge Graph',
    desc: 'Neo4j-backed relationships between DTCs, components, procedures, tools, and wiring diagrams.',
  },
  {
    icon: Car,
    title: 'Real OEM Data',
    desc: 'Factory service manual excerpts, exact torque specs, OEM part numbers, fluid capacities, and belt routing.',
  },
];

const PRICING = [
  {
    name: 'Search & Citation',
    price: '$0',
    period: 'forever',
    desc: 'For search engines and bots that send referral traffic.',
    features: [
      'Free access for verified crawlers',
      'Must send human traffic',
      'Rate limits apply',
    ],
    cta: 'See Bot Policy',
    href: '/llms.txt',
    primary: false,
  },
  {
    name: 'AI Training Feed',
    price: '$0.01',
    period: 'per page',
    desc: 'Clean markdown for LLM training and agent consumption.',
    features: [
      '/api/data/{year}/{make}/{model} — unlimited',
      '/api/data/.../repairs/{task}',
      '/api/data/.../dtc',
      '/api/data/.../specs',
      'No affiliate links, no HTML parsing',
      'Volume discounts at 100K and 1M pages',
    ],
    cta: 'View ACP Discovery',
    href: '/.well-known/acp.json',
    primary: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'annual',
    desc: 'Bulk crawls, white-label, and dedicated infrastructure.',
    features: [
      'Unlimited all endpoints',
      'Bulk export (JSON, Parquet, Markdown)',
      'White-label repair widgets',
      'Dedicated cache + rate limit',
      'SLA + phone support',
    ],
    cta: 'Contact Sales',
    href: 'mailto:api@alloemmanuals.com?subject=Enterprise%20API%20Inquiry',
    primary: false,
  },
];

/* ─────────────── Components ─────────────── */

function Badge({ children, color = 'cyan' }: { children: ReactNode; color?: 'cyan' | 'orange' | 'green' | 'red' }) {
  const map: Record<string, string> = {
    cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100',
    orange: 'border-orange-500/30 bg-orange-500/10 text-orange-100',
    green: 'border-green-500/30 bg-green-500/10 text-green-100',
    red: 'border-red-500/30 bg-red-500/10 text-red-100',
  };
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${map[color]}`}>
      {children}
    </span>
  );
}

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  return (
    <div className="relative group rounded-xl bg-black/60 border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/5">
        <span className="text-xs text-gray-400 font-mono">{lang}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 overflow-x-auto text-sm text-gray-300 font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ─────────────── Page ─────────────── */

export default function DevelopersPage() {
  return (
    <main className="min-h-screen pt-24 pb-16 bg-[#0a0a0c] text-[#EAEAEA]">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 mb-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm font-medium text-cyan-100">
          <Database className="w-4 h-4" />
          AI Training Feed
        </div>
        <h1 className="font-display font-black text-4xl sm:text-6xl text-white tracking-tight">
          Factory repair data{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200 glow-text">
            for LLMs
          </span>
        </h1>
        <p className="font-body text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
          Structured OEM data for <strong className="text-white">300,000+ vehicles</strong>, served as clean markdown.
          No affiliate links. No HTML parsing. Built for AI training, RAG, and agents. Pay per page with x402 — no
          subscriptions.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/.well-known/acp.json"
            className="inline-flex items-center gap-2 rounded-full bg-[#FF6B00] text-[#12171b] px-8 py-3.5 font-display font-bold text-sm uppercase tracking-wider hover:bg-[#FF8533] transition-colors"
          >
            <Lock className="w-4 h-4" />
            View Payment Terms
          </Link>
          <Link
            href="/openapi.json"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-3.5 font-display font-bold text-sm uppercase tracking-wider text-white hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-colors"
          >
            <Code className="w-4 h-4" />
            OpenAPI Spec
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 max-w-4xl mx-auto">
          {[
            ['300K+', 'Vehicles'],
            ['40+', 'Repair Tasks'],
            ['<100ms', 'Warm Response'],
            ['$0.01', 'Per Page'],
          ].map(([num, label]) => (
            <div
              key={label}
              className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-center"
            >
              <div className="font-display font-black text-2xl sm:text-3xl text-white">{num}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider max-w-6xl mx-auto mb-20" />

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl text-white">Why this API hits different</h2>
          <p className="text-gray-400 mt-2">Every response is vehicle-specific. No generic cross-vehicle fluff.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/5 bg-white/[0.03] p-6 hover:border-cyan-500/20 hover:bg-cyan-500/[0.03] transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
                <f.icon className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="font-display font-bold text-lg text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider max-w-6xl mx-auto mb-20" />

      {/* Endpoints */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl text-white">Endpoints</h2>
          <p className="text-gray-400 mt-2">
            RESTful JSON. CORS enabled.{' '}
            <Link href="/.well-known/api-catalog" className="text-cyan-400 hover:underline">
              RFC 9727 catalog
            </Link>{' '}
            available.
          </p>
        </div>

        <div className="space-y-6">
          {ENDPOINTS.map((ep) => (
            <div
              key={ep.path}
              className="rounded-2xl border border-white/5 bg-white/[0.03] p-6 sm:p-8 space-y-4"
            >
              <div className="flex flex-wrap items-center gap-3">
                <Badge color={ep.method === 'GET' ? 'green' : 'orange'}>{ep.method}</Badge>
                <code className="text-cyan-300 font-mono text-sm">{ep.path}</code>
                {ep.auth === 'x402' && (
                  <Badge color="orange">
                    <Lock className="w-3 h-3 inline mr-1" />
                    x402
                  </Badge>
                )}
                {ep.auth === 'none' && <Badge color="cyan">Free</Badge>}
              </div>
              <p className="text-gray-300 text-sm">{ep.desc}</p>
              <CodeBlock code={ep.example} />
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider max-w-6xl mx-auto mb-20" />

      {/* Response Example */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl text-white">What you get back</h2>
          <p className="text-gray-400 mt-2">
            Real OEM data from CHARM + LEMON corpus. Not AI hallucinations.
          </p>
        </div>
        <CodeBlock
          lang="json"
          code={`{
  "vehicle": { "year": "2013", "make": "BMW", "model": "X3", "name": "2013 BMW X3" },
  "task": { "slug": "oil-change", "title": "Oil Change", "description": "..." },
  "guide": {
    "difficulty": "Easy",
    "estimatedTime": "30-45 minutes",
    "tools": ["17mm socket", "32mm cap socket", "Torque wrench"],
    "parts": [
      { "name": "Engine Oil", "spec": "BMW LL-01 5W-30 — 6.9 qt", "oem": "..." }
    ],
    "steps": [
      { "stepNumber": 1, "instruction": "Warm engine 2 minutes..." }
    ],
    "torqueSpecs": "Drain plug: 18 ft-lbs | Filter cap: 18 ft-lbs",
    "warnings": ["BMW X3 requires BMW LL-01 certified oil..."]
  },
  "oemExcerpts": [
    { "title": "Lubrication System Capacity", "content": "...", "source": "Factory Service Manual" }
  ],
  "knowledgeGraph": {
    "groups": [
      { "kind": "spec", "title": "Specs Already on This Page", "nodes": [...] },
      { "kind": "dtc", "title": "Likely Trouble Codes", "nodes": [...] }
    ]
  },
  "corpusBacked": true
}`}
        />
      </section>

      <div className="section-divider max-w-6xl mx-auto mb-20" />

      {/* Markdown Response Example */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl text-white">What the AI feed looks like</h2>
          <p className="text-gray-400 mt-2">
            Clean markdown. No HTML. No affiliate links. Ready to ingest.
          </p>
        </div>
        <CodeBlock
          lang="markdown"
          code={`# 2010 Toyota Camry

**Vehicle:** 2010 Toyota Camry
**Make:** Toyota
**Model:** Camry
**Year:** 2010
**Corpus:** CHARM/LEMON (factory manual backed)

## Factory Specifications

- **Oil Type:** SAE 0W-20 synthetic
- **Oil Capacity:** 4.5 quarts with filter
- **Coolant Type:** Toyota Super Long Life Coolant
- **Tire Size:** P215/60R16 94H
- **Battery Location:** Engine compartment, driver side

## Common Repairs

### Oil Change
Easy · 30–45 minutes
**Tools:** 14mm socket, oil filter wrench, drain pan

### Brake Pad Replacement
Intermediate · 1–2 hours
**Tools:** Socket set, C-clamp, torque wrench

## Diagnostic Trouble Codes

- **P0420** — Catalyst System Efficiency Below Threshold (Emissions)
- **P0171** — System Too Lean Bank 1 (Engine)

---

*Source: AllOEMManuals.com — Factory service manual data for 2010 Toyota Camry*`}
        />
      </section>

      <div className="section-divider max-w-6xl mx-auto mb-20" />

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl text-white">Pricing</h2>
          <p className="text-gray-400 mt-2">No subscriptions. Pay for what you use. Cancel anytime.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {PRICING.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 sm:p-8 flex flex-col ${
                plan.primary
                  ? 'border-cyan-500/40 bg-cyan-500/[0.06] shadow-[0_0_40px_rgba(34,211,238,0.12)]'
                  : 'border-white/5 bg-white/[0.03]'
              }`}
            >
              <div className="mb-6">
                <h3 className="font-display font-bold text-xl text-white">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="font-display font-black text-3xl text-white">{plan.price}</span>
                  <span className="text-gray-400 text-sm">/{plan.period}</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">{plan.desc}</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-display font-bold text-sm uppercase tracking-wider transition-colors ${
                  plan.primary
                    ? 'bg-[#FF6B00] text-[#12171b] hover:bg-[#FF8533]'
                    : 'border border-white/20 bg-white/5 text-white hover:border-cyan-500/50 hover:bg-cyan-500/10'
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <div className="section-divider max-w-6xl mx-auto mb-20" />

      {/* Integration / Discovery */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl text-white">Agent Discovery</h2>
          <p className="text-gray-400 mt-2">
            AI agents and crawlers automatically find payment terms and capabilities.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: 'OpenAPI 3.0', href: '/openapi.json', desc: 'x-payment-info on every operation' },
            { label: 'API Catalog', href: '/.well-known/api-catalog', desc: 'RFC 9727 Linkset' },
            { label: 'ACP', href: '/.well-known/acp.json', desc: 'Agentic Commerce Protocol' },
            { label: 'MCP Server Card', href: '/.well-known/mcp/server-card.json', desc: 'Model Context Protocol' },
            { label: 'OAuth Server', href: '/.well-known/oauth-authorization-server', desc: 'agent_auth skill' },
            { label: 'Auth Guide', href: '/auth.md', desc: 'Agent registration instructions' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-white/5 bg-white/[0.03] p-5 hover:border-cyan-500/20 hover:bg-cyan-500/[0.03] transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-display font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {item.label}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
              </div>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <div className="section-divider max-w-6xl mx-auto mb-20" />

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <h2 className="font-display font-black text-3xl sm:text-4xl text-white">
          Ready to train on real automotive data?
        </h2>
        <p className="text-gray-300 max-w-2xl mx-auto">
          View payment discovery, explore the OpenAPI spec, or email us with your use case. Free tier available for
          search engines and citation bots that send referral traffic.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/.well-known/acp.json"
            className="inline-flex items-center gap-2 rounded-full bg-[#FF6B00] text-[#12171b] px-8 py-3.5 font-display font-bold text-sm uppercase tracking-wider hover:bg-[#FF8533] transition-colors"
          >
            <Lock className="w-4 h-4" />
            View x402 Terms
          </Link>
          <a
            href="mailto:api@alloemmanuals.com?subject=AI%20Training%20Feed%20Inquiry"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-3.5 font-display font-bold text-sm uppercase tracking-wider text-white hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-colors"
          >
            <Code className="w-4 h-4" />
            Contact API Team
          </a>
        </div>
      </section>
    </main>
  );
}
