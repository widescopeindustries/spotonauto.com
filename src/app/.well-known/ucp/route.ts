import { NextResponse } from 'next/server';

/**
 * Universal Commerce Protocol (UCP) profile.
 */
export async function GET() {
  const ucp = {
    ucp: {
      protocol: {
        name: 'ucp',
        version: '0.1.0',
      },
      services: [
        {
          id: 'premium-repair-data',
          name: 'Premium Factory Repair Data',
          description:
            'Structured OEM repair data including torque specs, fluid capacities, wiring diagrams, and part numbers.',
          endpoints: {
            purchase: 'https://alloemmanuals.com/api/premium-repair-data',
            docs: 'https://alloemmanuals.com/',
            discovery: 'https://alloemmanuals.com/.well-known/acp.json',
          },
          capabilities: ['read', 'purchase'],
        },
      ],
      capabilities: {
        payments: ['x402'],
        networks: ['solana-devnet'],
      },
      spec_url: 'https://ucp.dev/specification/overview/',
    },
  };

  return NextResponse.json(ucp, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
