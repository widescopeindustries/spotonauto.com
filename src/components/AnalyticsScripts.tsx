'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { CANONICAL_HOST } from '@/lib/host';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-WNFX6CY9RN';
const AHREFS_KEY = 'Id9DIK0mrHJtsEHStxIWNA';

export default function AnalyticsScripts() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (window.location.hostname !== CANONICAL_HOST) return;
    // Skip headless/automated browsers (Puppeteer, Playwright, etc.)
    if (navigator.webdriver) return;
    // Delay 3s to filter zero-engagement bot traffic (Singapore bots bounce in <1s)
    const timer = setTimeout(() => setEnabled(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!enabled) return null;

  return (
    <>
      {GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                send_page_view: false
              });
            `}
          </Script>
        </>
      )}

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
