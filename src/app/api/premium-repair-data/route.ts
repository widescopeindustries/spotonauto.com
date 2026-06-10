import { NextResponse } from 'next/server';

/**
 * Premium repair data endpoint — payment-gated via x402.
 * Returns factory manual excerpts, torque specs, and parts list
 * for any vehicle/repair query once payment is settled.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const make = searchParams.get('make');
  const model = searchParams.get('model');
  const task = searchParams.get('task');

  if (!year || !make || !model || !task) {
    return NextResponse.json(
      { error: 'Missing required parameters: year, make, model, task' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    vehicle: `${year} ${make} ${model}`,
    task,
    tier: 'premium',
    data: {
      note: 'This is a payment-gated endpoint for AI agents.',
      includes: [
        'factory manual excerpts',
        'torque specifications',
        'fluid capacities',
        'wiring diagram references',
        'OEM part numbers',
      ],
      exampleValue: 'Exact OEM repair data extracted from CHARM/LEMON corpus.',
    },
    payment: {
      protocol: 'x402',
      scheme: 'exact',
      price: '$0.01',
      asset: 'USDC',
    },
  });
}
