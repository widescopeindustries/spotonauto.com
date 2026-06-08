/**
 * Client-side geo-redirect for Amazon affiliate links.
 *
 * Amazon OneLink is the gold standard, but requires an Amazon OneLink ID.
 * This script acts as a fallback: it intercepts clicks to amazon.com and
 * rewrites them to the visitor's local Amazon store using a country map.
 *
 * How it works:
 *   1. Try to read country from window.__AMAZON_COUNTRY (injected server-side
 *      from CF-IPCountry header) or fallback to browser timezone language.
 *   2. On any click to an amazon.com link, rewrite href to local domain+tag.
 *   3. If Amazon OneLink script is present, let it take precedence.
 */

'use client';

import { useEffect } from 'react';
import { AMAZON_STORES, COUNTRY_TO_STORE, localizeAmazonUrl } from '@/lib/amazonGeo';

const GEO_REDIRECT_SCRIPT = `
(function(){
  if (typeof window === 'undefined') return;

  // Don't run if Amazon OneLink is active — let Amazon handle it.
  if (window.__amazon_onelink_active) return;

  function getCountry() {
    if (window.__AMAZON_COUNTRY) return window.__AMAZON_COUNTRY;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const map = {
        'America/New_York':'US','America/Los_Angeles':'US','America/Chicago':'US','America/Denver':'US',
        'America/Toronto':'CA','America/Vancouver':'CA',
        'Europe/London':'GB','Europe/Dublin':'IE',
        'Europe/Berlin':'DE','Europe/Paris':'FR','Europe/Rome':'IT','Europe/Madrid':'ES',
        'Europe/Amsterdam':'NL','Europe/Brussels':'BE','Europe/Vienna':'AT','Europe/Zurich':'CH',
        'Europe/Stockholm':'SE','Europe/Oslo':'NO','Europe/Copenhagen':'DK','Europe/Helsinki':'FI',
        'Asia/Tokyo':'JP','Asia/Seoul':'KR',
        'Australia/Sydney':'AU','Australia/Melbourne':'AU','Pacific/Auckland':'NZ',
        'Asia/Singapore':'SG','Asia/Kuala_Lumpur':'MY','Asia/Jakarta':'ID','Asia/Bangkok':'TH',
        'Asia/Manila':'PH','Asia/Ho_Chi_Minh':'VN','Asia/Hong_Kong':'HK',
        'Asia/Kolkata':'IN','Asia/Karachi':'PK','Asia/Dhaka':'BD','Asia/Colombo':'LK',
        'America/Sao_Paulo':'BR','America/Mexico_City':'MX'
      };
      if (map[tz]) return map[tz];
      const lang = (navigator.language || '').toUpperCase();
      if (lang.startsWith('EN-GB') || lang.startsWith('EN-IE')) return 'GB';
      if (lang.startsWith('EN-CA')) return 'CA';
      if (lang.startsWith('EN-AU')) return 'AU';
      if (lang.startsWith('EN-')) return 'US';
      if (lang.startsWith('JA')) return 'JP';
      if (lang.startsWith('DE')) return 'DE';
      if (lang.startsWith('FR')) return 'FR';
      if (lang.startsWith('ES')) return 'ES';
      if (lang.startsWith('IT')) return 'IT';
      if (lang.startsWith('PT-BR')) return 'BR';
      if (lang.startsWith('PT')) return 'US';
      if (lang.startsWith('NL')) return 'NL';
      if (lang.startsWith('SV')) return 'SE';
      if (lang.startsWith('PL')) return 'PL';
      if (lang.startsWith('ZH-HK') || lang.startsWith('ZH-TW')) return 'SG';
      if (lang.startsWith('ZH')) return 'SG';
      if (lang.startsWith('KO')) return 'JP';
      if (lang.startsWith('HI') || lang.startsWith('BN') || lang.startsWith('TA') || lang.startsWith('TE')) return 'IN';
      if (lang.startsWith('MS')) return 'SG';
      if (lang.startsWith('TH')) return 'SG';
      if (lang.startsWith('VI')) return 'SG';
      if (lang.startsWith('ID')) return 'SG';
    } catch(e){}
    return 'US';
  }

  const country = getCountry();
  if (!country || country === 'US') return;

  const storeMap = ${JSON.stringify(Object.fromEntries(
    Object.entries(COUNTRY_TO_STORE).map(([k, v]) => [k, AMAZON_STORES[v]?.domain || 'amazon.com'])
  ))};
  const tagMap = ${JSON.stringify(Object.fromEntries(
    Object.entries(COUNTRY_TO_STORE).map(([k, v]) => [k, AMAZON_STORES[v]?.tag || 'aiautorepair-20'])
  ))};

  const storeCode = ${JSON.stringify(COUNTRY_TO_STORE)}[country] || 'US';
  const targetDomain = storeMap[country] || 'amazon.com';
  const targetTag = tagMap[country] || 'aiautorepair-20';
  if (targetDomain === 'amazon.com') return;

  document.addEventListener('click', function(e) {
    var el = e.target;
    while (el && el !== document) {
      if (el.tagName === 'A') {
        var href = el.getAttribute('href') || '';
        if (href.indexOf('amazon.com') !== -1 && href.indexOf(targetDomain) === -1) {
          try {
            var url = new URL(href, window.location.href);
            url.hostname = targetDomain;
            url.searchParams.set('tag', targetTag);
            el.setAttribute('href', url.toString());
          } catch (err) {
            el.setAttribute('href', href.replace('amazon.com', targetDomain).replace(/([?&])tag=[^&]*/, '$1tag=' + targetTag));
          }
        }
      }
      el = el.parentElement;
    }
  }, true);

  // Also expose for server-rendered links that want to be geo-aware
  window.__AMAZON_COUNTRY = country;
  window.__AMAZON_STORE = targetDomain;
  window.__AMAZON_TAG = targetTag;
})();
`;

declare global {
  interface Window {
    __AMAZON_COUNTRY?: string;
    __AMAZON_STORE?: string;
    __AMAZON_TAG?: string;
    __amazon_onelink_active?: boolean;
  }
}

export default function AmazonGeoRedirect() {
  useEffect(() => {
    // Run immediately on mount — script already inlined below runs before hydration too.
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__amazon_geo_redirect_loaded = true;
    }
  }, []);

  return (
    <script
      dangerouslySetInnerHTML={{ __html: GEO_REDIRECT_SCRIPT }}
    />
  );
}

/**
 * Server-side helper: read country from Cloudflare CF-IPCountry header
 * and inject it into the HTML for the client-side script.
 */
export function getAmazonCountryFromHeaders(
  headers: Headers | Record<string, string | string[] | undefined>
): string | undefined {
  const get = (key: string) => {
    if ('get' in headers && typeof headers.get === 'function') {
      return headers.get(key) || undefined;
    }
    const v = (headers as Record<string, string | string[] | undefined>)[key];
    return Array.isArray(v) ? v[0] : v;
  };

  return (
    get('cf-ipcountry') ||
    get('CF-IPCountry') ||
    get('cloudflare-ipcountry') ||
    get('x-country-code') ||
    undefined
  );
}

/**
 * Localize an array of URLs server-side when country is known.
 */
export function localizeUrls(urls: string[], countryCode?: string | null): string[] {
  if (!countryCode) return urls;
  return urls.map((url) => localizeAmazonUrl(url, countryCode));
}
