export type AmazonCtaVariant = 'A' | 'B';

function djb2(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i);
  }
  return Math.abs(hash);
}

/**
 * Deterministic 50/50 assignment for tool-page Amazon CTA copy tests.
 * Uses slug so users/crawlers see a stable variant on each URL.
 */
export function getAmazonCtaVariantForSlug(slug: string): AmazonCtaVariant {
  return djb2(slug) % 2 === 0 ? 'A' : 'B';
}

export function getAmazonCtaLabel(variant: AmazonCtaVariant): string {
  return variant === 'A' ? 'Shop Exact Match on Amazon' : 'Check Fitment on Amazon';
}

