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

  useEffect(() => {
    if (window.location.hostname !== CANONICAL_HOST) return;
    if (navigator.webdriver) return;
    const timer = setTimeout(() => setEnabled(true), 500);
    return () => clearTimeout(timer);
  }, []);

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
