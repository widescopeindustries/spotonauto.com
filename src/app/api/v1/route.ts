import { NextResponse } from 'next/server';

/**
 * x402 discovery endpoint at /api/v1.
 * Returns 402 Payment Required to signal x402 support to AI agent scanners.
 */
export async function GET() {
  return new NextResponse(
    JSON.stringify({
      error: 'Payment Required',
      message: 'This endpoint requires x402 payment. See /.well-known/acp.json for payment details.',
      payment: {
        protocol: 'x402',
        scheme: 'exact',
        network: 'solana-devnet',
        asset: 'USDC',
        price: '$0.01',
      },
    }),
    {
      status: 402,
      headers: {
        'Content-Type': 'application/json',
        'X-Payment-Required': 'x402',
      },
    }
  );
}
