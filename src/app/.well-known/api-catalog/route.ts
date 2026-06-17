import { NextResponse } from 'next/server';

/**
 * API Catalog per RFC 9727.
 * Advertises the automotive data APIs available to AI agents.
 */
export async function GET() {
  const catalog = {
    linkset: [
      {
        anchor: 'https://alloemmanuals.com/',
        rel: 'service',
        href: 'https://alloemmanuals.com/',
        title: 'AllOEMManuals — Factory repair data for 300K+ vehicles',
      },
      {
        anchor: 'https://alloemmanuals.com/api/v1/repair',
        rel: 'service-desc',
        href: 'https://alloemmanuals.com/api/v1/repair?year=2024&make=toyota&model=camry&task=oil-change',
        title: 'Vehicle-specific repair guide API',
        type: 'application/json',
      },
      {
        anchor: 'https://alloemmanuals.com/api/wiring-selector',
        rel: 'service-desc',
        href: 'https://alloemmanuals.com/api/wiring-selector',
        title: 'Wiring diagram coverage selector API',
        type: 'application/json',
      },
      {
        anchor: 'https://alloemmanuals.com/api/graph/dtc/{code}',
        rel: 'service-desc',
        href: 'https://alloemmanuals.com/api/graph/dtc/P0420',
        title: 'DTC code lookup API',
        type: 'application/json',
      },
      {
        anchor: 'https://alloemmanuals.com/api/data/{year}/{make}/{model}',
        rel: 'service-desc',
        href: 'https://alloemmanuals.com/api/data/2010/toyota/camry',
        title: 'AI Training Feed — clean markdown vehicle data (payment-gated)',
        type: 'text/markdown',
      },
      {
        anchor: 'https://alloemmanuals.com/api/premium-repair-data',
        rel: 'service-desc',
        href: 'https://alloemmanuals.com/api/premium-repair-data?year=2024&make=toyota&model=camry&task=oil-change',
        title: 'Premium factory repair data API (payment-gated)',
        type: 'application/json',
      },
      {
        anchor: 'https://alloemmanuals.com/api/data/{year}/{make}/{model}',
        rel: 'payment',
        href: 'https://alloemmanuals.com/.well-known/acp.json',
        title: 'Agentic Commerce Protocol discovery',
        type: 'application/json',
      },
      {
        anchor: 'https://alloemmanuals.com/api/premium-repair-data',
        rel: 'service-doc',
        href: 'https://alloemmanuals.com/',
        title: 'Documentation',
      },
    ],
  };

  return NextResponse.json(catalog, {
    headers: {
      'Content-Type': 'application/linkset+json',
    },
  });
}
