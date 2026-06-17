import { NextRequest, NextResponse } from 'next/server';
import { debitPageRequest, getCustomerByApiKey } from './credits';
import { getPublicPricing } from './stripe';
import { extractBearerToken, isStripeApiKeyFormat } from './apiKey';

export interface PaymentGateResult {
  allowed: boolean;
  customerId?: string;
  remaining?: number;
  response?: NextResponse;
}

export const STRIPE_PAYMENT_INFO = {
  protocol: 'stripe',
  model: 'credits',
  price: '$0.01',
  per: 'page',
  info_url: 'https://alloemmanuals.com/for-ai',
  checkout_url: 'https://alloemmanuals.com/api/stripe/checkout',
  account_url: 'https://alloemmanuals.com/api/account',
  pricing: getPublicPricing(),
};

export const X402_PAYMENT_INFO = {
  protocol: 'x402',
  scheme: 'exact',
  price: '$0.01',
  asset: 'USDC',
  network: 'solana-devnet',
  per: 'page',
  volume_discounts: {
    '100000': '$0.005',
    '1000000': '$0.001',
  },
};

export async function checkStripeAccess(request: NextRequest, pagePath: string): Promise<PaymentGateResult> {
  const apiKey = extractBearerToken(request);
  if (!apiKey) {
    return { allowed: false };
  }

  // If the bearer token is not a Stripe-format API key, it must be an x402
  // payment token that was already verified by middleware. We verify that
  // middleware marked the request as paid before allowing access.
  if (!isStripeApiKeyFormat(apiKey)) {
    const verified = request.headers.get('X-Payment-Verified') === 'x402';
    if (verified) {
      return { allowed: true };
    }
    return {
      allowed: false,
      response: buildStripeRequiredResponse(request, pagePath, 'invalid_api_key'),
    };
  }

  const debit = await debitPageRequest(apiKey, pagePath);
  if (!debit.success) {
    // Distinguish invalid key from insufficient credits
    const isInvalidKey = debit.reason === 'invalid_api_key';
    return {
      allowed: false,
      response: buildStripeRequiredResponse(request, pagePath, isInvalidKey ? 'invalid_api_key' : 'insufficient_credits'),
    };
  }

  return {
    allowed: true,
    customerId: debit.customer.id,
    remaining: debit.remaining,
  };
}

export async function getCustomerFromRequest(request: NextRequest) {
  const apiKey = extractBearerToken(request);
  if (!apiKey) return null;
  return getCustomerByApiKey(apiKey);
}

export function buildStripeRequiredResponse(
  request: NextRequest,
  pagePath: string,
  reason: 'missing_payment' | 'invalid_api_key' | 'insufficient_credits' = 'missing_payment'
): NextResponse {
  const acceptHeader = request.headers.get('accept') || '';
  const wantsMarkdown = acceptHeader.includes('text/markdown') || request.nextUrl.pathname.startsWith('/api/data/');

  const body = {
    error: 'Payment Required',
    message:
      reason === 'invalid_api_key'
        ? 'Invalid API key. Purchase credits to get a valid key.'
        : reason === 'insufficient_credits'
          ? 'Insufficient credits. Purchase more credits to continue.'
          : 'Automated access to this content requires payment.',
    policy: 'ai-train=licensed, search=yes, ai-input=licensed',
    payment_discovery: 'https://alloemmanuals.com/.well-known/acp.json',
    premium_api: `https://alloemmanuals.com${pagePath}`,
    payment_options: [X402_PAYMENT_INFO, STRIPE_PAYMENT_INFO],
  };

  if (wantsMarkdown) {
    const mdBody = `# Payment Required — AI Training Feed

We repackage our factory manual corpus two ways.

## Option 1: Human Site (Free for Browsers)

HTML, navigation, affiliate links for parts and tools on every page. Built for humans to read and click.

## Option 2: AI Training Feed (Paid — This Endpoint)

The same underlying data, repackaged for AI consumption:

- **Clean markdown** — no HTML parsing required
- **Zero affiliate links** — no noise in your training data
- **No ads, no nav, no site chrome** — content only
- **Structured sections** — hierarchical markdown with clear headings
- **300,000+ vehicles** (1960–2025)

## Pricing
- **Standard:** $0.01 per page
- **Volume (100K+ pages/month):** $0.005 per page
- **Enterprise (1M+ pages/month):** $0.001 per page

## Pay with Stripe (Real Money)
1. Visit https://alloemmanuals.com/for-ai for details and sample data
2. Buy credits at https://alloemmanuals.com/api/stripe/checkout?pack=starter
3. Complete checkout
4. Your API key will be shown after payment
5. Include your key: \`Authorization: Bearer <api_key>\`

## Pay with x402 (Agent-Native, Devnet)
1. Visit https://alloemmanuals.com/.well-known/acp.json for payment discovery
2. Use x402 exact scheme on Solana devnet
3. Include payment token in Authorization header

## Sample Endpoints
- \`/api/data/{year}/{make}/{model}\` — Full vehicle hub
- \`/api/data/{year}/{make}/{model}/repairs/{task}\` — Repair guide
- \`/api/data/{year}/{make}/{model}/dtc\` — Diagnostic codes
- \`/api/data/{year}/{make}/{model}/specs\` — Factory specs

*Citation required. No resale. Enterprise licensing available.*
`;
    return new NextResponse(mdBody, {
      status: 402,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'X-Payment-Required': 'stripe,x402',
        'Accept-Payment': 'stripe,x402',
        'Link': '<https://alloemmanuals.com/.well-known/acp.json>; rel="payment"',
        'Cache-Control': 'no-store',
      },
    });
  }

  return NextResponse.json(body, {
    status: 402,
    headers: {
      'Content-Type': 'application/json',
      'X-Payment-Required': 'stripe,x402',
      'Accept-Payment': 'stripe,x402',
      'Link': '<https://alloemmanuals.com/.well-known/acp.json>; rel="payment"',
      'Cache-Control': 'no-store',
    },
  });
}

export function attachCreditHeader(response: NextResponse, remaining?: number) {
  if (remaining !== undefined) {
    response.headers.set('X-Credits-Remaining', String(remaining));
  }
  response.headers.set('X-Payment-Accepted', 'stripe,x402');
  return response;
}
