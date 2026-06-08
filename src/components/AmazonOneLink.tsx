/**
 * Amazon OneLink script loader.
 *
 * OneLink is Amazon's official geo-redirect service. When enabled, it
 * automatically redirects international visitors to their local Amazon
 * store while preserving your affiliate tag.
 *
 * To enable:
 *   1. Sign up at https://affiliate-program.amazon.com/oneLink
 *   2. Create a OneLink account and get your "1P Tracking ID"
 *   3. Set NEXT_PUBLIC_AMAZON_ONELINK_ID in your env
 *
 * If OneLink is not configured, the custom geo-redirect script in
 * AmazonGeoRedirect.tsx acts as the fallback.
 */

'use client';

import Script from 'next/script';

const ONELINK_ID = process.env.NEXT_PUBLIC_AMAZON_ONELINK_ID?.trim();

export default function AmazonOneLink() {
  if (!ONELINK_ID) return null;

  return (
    <Script
      id="amazon-onelink"
      strategy="lazyOnload"
      src={`https://webservices.amazon.com/pn/tracking/${ONELINK_ID}`}
      onLoad={() => {
        if (typeof window !== 'undefined') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).__amazon_onelink_active = true;
        }
      }}
    />
  );
}
