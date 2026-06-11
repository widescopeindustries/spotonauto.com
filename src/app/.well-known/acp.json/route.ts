import { NextResponse } from 'next/server';

/**
 * Agentic Commerce Protocol (ACP) discovery document.
 * Advertises the x402 payment-gated API to AI agents.
 */
export async function GET() {
  const acp = {
    protocol: {
      name: 'acp',
      version: '0.1.0',
    },
    api_base_url: 'https://alloemmanuals.com',
    transports: ['https', 'x402'],
    capabilities: {
      services: [
        {
          id: 'premium-repair-data',
          name: 'Premium Factory Repair Data',
          description:
            'Structured OEM repair data including torque specs, fluid capacities, wiring diagrams, and part numbers. Paid via x402 on Solana devnet.',
          endpoint: 'https://alloemmanuals.com/api/premium-repair-data',
          payment: {
            protocol: 'x402',
            scheme: 'exact',
            price: '$0.01',
            asset: 'USDC',
            network: 'solana-devnet',
          },
        },
      ],
    },
    acp: {
      version: '0.1.0',
      protocol: {
        name: 'acp',
        version: '0.1.0',
      },
      name: 'acp',
      api_base_url: 'https://alloemmanuals.com',
      transports: ['https', 'x402'],
      capabilities: {
        services: [
          {
            id: 'premium-repair-data',
            name: 'Premium Factory Repair Data',
            description:
              'Structured OEM repair data including torque specs, fluid capacities, wiring diagrams, and part numbers. Paid via x402 on Solana devnet.',
            endpoint: 'https://alloemmanuals.com/api/premium-repair-data',
            payment: {
              protocol: 'x402',
              scheme: 'exact',
              price: '$0.01',
              asset: 'USDC',
              network: 'solana-devnet',
            },
          },
        ],
      },
    },
  };

  return NextResponse.json(acp, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
