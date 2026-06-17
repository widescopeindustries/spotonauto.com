import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

export const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    })
  : null;

export function isStripeConfigured(): boolean {
  return Boolean(stripe && process.env.STRIPE_WEBHOOK_SECRET);
}

export const CREDIT_PACKS = [
  { id: 'starter', name: 'Starter', priceCents: 1000, credits: 1000 },
  { id: 'growth', name: 'Growth', priceCents: 5000, credits: 5500 },
  { id: 'scale', name: 'Scale', priceCents: 20000, credits: 24000 },
  { id: 'enterprise', name: 'Enterprise', priceCents: 100000, credits: 130000 },
];

export function getCreditPack(packId: string | null) {
  return CREDIT_PACKS.find((p) => p.id === packId) || CREDIT_PACKS[0];
}

export function getPriceId(packId: string): string | undefined {
  const envVarMap: Record<string, string | undefined> = {
    starter: process.env.STRIPE_PRICE_STARTER,
    growth: process.env.STRIPE_PRICE_GROWTH,
    scale: process.env.STRIPE_PRICE_SCALE,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
  };
  return envVarMap[packId];
}

export function getPublicPricing() {
  return CREDIT_PACKS.map((p) => ({
    id: p.id,
    name: p.name,
    price_usd: (p.priceCents / 100).toFixed(2),
    credits: p.credits,
    per_page_usd: (p.priceCents / p.credits / 100).toFixed(4),
  }));
}
