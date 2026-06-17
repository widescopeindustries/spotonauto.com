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
        network: 'solana-devnet',
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
      payment_discovery: 'https://alloemmanuals.com/.well-known/acp.json',
      premium_api: 'https://alloemmanuals.com/api/premium-repair-data',
      payment_options: [
        {
          protocol: 'x402',
          scheme: 'exact',
          price: '$0.01',
          asset: 'USDC',
          network: 'solana-devnet',
          per: 'page',
        },
        {
          protocol: 'stripe',
          model: 'credits',
          price: '$0.01',
          per: 'page',
          info_url: 'https://alloemmanuals.com/for-ai',
          checkout_url: 'https://alloemmanuals.com/api/stripe/checkout',
          account_url: 'https://alloemmanuals.com/api/account',
        },
      ],
    }),
    {
      status: 402,
      headers: {
        'Content-Type': 'application/json',
        'X-Payment-Required': 'stripe,x402',
        'Accept-Payment': 'stripe,x402',
        'Link': '<https://alloemmanuals.com/.well-known/acp.json>; rel="payment"',
        'Cache-Control': 'no-store',
      },
    }
  );
}
