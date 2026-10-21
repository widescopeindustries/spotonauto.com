'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { CANONICAL_HOST } from '@/lib/host';

const AHREFS_KEY = 'OB5T6GJG9WfWLOn7Ahcx5Q';

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

  const chromeFamily = /chrome|chromium|crios/.test(ua);
  const noPlugins = navigator.plugins.length === 0 && navigator.mimeTypes.length === 0;
  const headlessWindow = window.outerWidth === 0 && window.outerHeight === 0;
  const noChromeObject = chromeFamily && typeof (window as any).chrome === 'undefined';
  if (noPlugins || headlessWindow || noChromeObject) return 'suspect';

  return 'human';
}

export default function AnalyticsScripts() {
  const [enabled, setEnabled] = useState(false);
  const trafficType = getTrafficType();

  useEffect(() => {
    if (window.location.hostname !== CANONICAL_HOST) return;
    if (trafficType === 'known_bot') return;

    // Defer non-critical analytics to idle time so main-thread execution stays 100% responsive for CWV/TBT
    if ('requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(() => setEnabled(true), { timeout: 4000 });
      return () => {
        if ('cancelIdleCallback' in window) (window as any).cancelIdleCallback(handle);
      };
    } else {
      const timer = setTimeout(() => setEnabled(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [trafficType]);

  if (!enabled) return null;

  return (
    <>
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
