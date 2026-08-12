'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { CANONICAL_HOST } from '@/lib/host';
import Clarity from '@microsoft/clarity';
import { deriveClarityPageTags, applyClarityPageTags } from '@/lib/clarity';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-KS1JPX0V7P';
const AHREFS_KEY = 'Id9DIK0mrHJtsEHStxIWNA';
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || 'wk5l41apgb';

type TrafficType = 'human' | 'suspect' | 'known_bot';

function hasBotCookie() {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').some((c) => c.startsWith('aom_analytics=0'));
}

function getTrafficType(): TrafficType {
  if (typeof window === 'undefined') return 'known_bot';
  const ua = navigator.userAgent.toLowerCase();
  if (navigator.webdriver) return 'known_bot';
  if (hasBotCookie()) return 'known_bot';
  if (/bot|crawl|spider|scraper|headless|puppeteer|selenium|playwright|lighthouse|phantomjs/.test(ua)) {
    return 'known_bot';
  }

  // Suspicious / headless-browser signals. These can false-positive on privacy
  // hardened real browsers, so they get their own bucket instead of blocked.
  const chromeFamily = /chrome|chromium|crios/.test(ua);
  const noPlugins = navigator.plugins.length === 0 && navigator.mimeTypes.length === 0;
  const headlessWindow = window.outerWidth === 0 && window.outerHeight === 0;
  const noChromeObject = chromeFamily && typeof (window as any).chrome === 'undefined';
  if (noPlugins || headlessWindow || noChromeObject) return 'suspect';

  return 'human';
}

function ClarityPageTags() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hostname !== CANONICAL_HOST) return;
    const tags = deriveClarityPageTags(pathname || '/', searchParams?.toString() || '');
    applyClarityPageTags(tags);
  }, [pathname, searchParams]);

  return null;
}

export default function AnalyticsScripts() {
  const [enabled, setEnabled] = useState(false);
  const trafficType = getTrafficType();

  useEffect(() => {
    if (window.location.hostname !== CANONICAL_HOST) return;
    if (trafficType === 'known_bot') return;
    const timer = setTimeout(() => setEnabled(true), 500);
    return () => clearTimeout(timer);
  }, [trafficType]);

  useEffect(() => {
    if (!enabled || !CLARITY_ID) return;
    Clarity.init(CLARITY_ID);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <ClarityPageTags />
      {GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="lazyOnload"
          />
          <Script id="google-analytics" strategy="lazyOnload">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              window.__AOM_TRAFFIC_TYPE__ = '${trafficType}';
              gtag('js', new Date());
              gtag('set', 'user_properties', { traffic_type: '${trafficType}' });
              gtag('config', '${GA_MEASUREMENT_ID}', {
                send_page_view: true,
                transport_type: 'beacon',
                cookie_flags: 'SameSite=None;Secure',
              });
            `}
          </Script>
        </>
      )}

      {/* Google AdSense */}
      <Script
        id="adsense-script"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4727419009542011"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />

      <Script id="ahrefs-deferred" strategy="lazyOnload">
        {`
          (function () {
            function loadAhrefs() {
              if (document.querySelector('script[data-ahrefs-analytics]')) return;
              var s = document.createElement('script');
              s.src = 'https://analytics.ahrefs.com/analytics.js';
              s.dataset.key = '${AHREFS_KEY}';
              s.dataset.ahrefsAnalytics = 'true';
              s.defer = true;
              document.head.appendChild(s);
            }
            if ('requestIdleCallback' in window) {
              requestIdleCallback(loadAhrefs, { timeout: 10000 });
            } else {
              setTimeout(loadAhrefs, 6000);
            }
          })();
        `}
      </Script>
    </>
  );
}
