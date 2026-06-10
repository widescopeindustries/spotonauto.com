import { NextResponse } from 'next/server';

/**
 * x402 Protocol Discovery Endpoint.
 * Advertises payment-gated resources for AI agent consumption.
 */
export async function GET() {
  const discovery = {
    version: '1.0',
    resources: [
      {
        id: 'premium-repair-data',
        name: 'Premium Factory Repair Data',
        description:
          'Structured OEM repair data including torque specs, fluid capacities, wiring diagrams, and part numbers.',
        endpoint: 'https://alloemmanuals.com/api/premium-repair-data',
        method: 'GET',
        payment: {
          protocol: 'x402',
          scheme: 'exact',
          price: '$0.01',
          asset: 'USDC',
          network: 'solana-devnet',
          pay_to: process.env.X402_SOLANA_PAY_TO || '',
        },
        required_params: ['year', 'make', 'model', 'task'],
      },
    ],
    facilitator: {
      url: process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator',
    },
    documentation: 'https://alloemmanuals.com/auth.md',
  };

  return NextResponse.json(discovery, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
