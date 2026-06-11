import { NextResponse } from 'next/server';

/**
 * x402 discovery endpoint at /api/v1.
 * Returns 402 Payment Required with proper x402 headers.
 */
export async function GET() {
  const x402Payload = {
    x402Version: 2,
    error: 'Payment required',
    resource: {
      url: 'https://alloemmanuals.com/api/premium-repair-data',
      description: 'Premium factory repair data including torque specs, fluid capacities, and OEM part numbers.',
      mimeType: 'application/json',
    },
    accepts: [
      {
        scheme: 'exact',
        network: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
        amount: '10000',
        asset: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAFERSYqZKWQnQdNVS',
        payTo: 'A3pgu4FXYkmfvzDdp6bTD77JcNXsNFTEtd3exnANxKJT',
        maxTimeoutSeconds: 300,
      },
    ],
  };

  return new NextResponse(
    JSON.stringify({
      error: 'Payment Required',
      message: 'This endpoint requires x402 payment. See /.well-known/acp.json for payment details.',
    }),
    {
      status: 402,
      headers: {
        'Content-Type': 'application/json',
        'payment-required': Buffer.from(JSON.stringify(x402Payload)).toString('base64'),
      },
    }
  );
}
