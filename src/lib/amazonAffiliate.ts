const DEFAULT_AMAZON_AFFILIATE_TAG = 'aiautorepai04-20';

export const AMAZON_AFFILIATE_TAG =
  process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG?.trim() || DEFAULT_AMAZON_AFFILIATE_TAG;

export function buildAmazonSearchUrl(query: string, department = 'automotive'): string {
  const params = new URLSearchParams({
    k: query,
    tag: AMAZON_AFFILIATE_TAG,
  });

  if (department) {
    params.set('i', department);
  }

  return `https://www.amazon.com/s?${params.toString()}`;
}
