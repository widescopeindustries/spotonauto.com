'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { GA_MEASUREMENT_ID } from '@/lib/ga';

/** Sends a GA4 page_view after Next.js client navigations. The first view comes from the head tag. */
export default function Ga4PageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const skipFirst = useRef(true);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag !== 'function') return;
    const query = searchParams.toString();
    const page_path = query ? `${pathname}?${query}` : pathname;
    gtag('event', 'page_view', {
      send_to: GA_MEASUREMENT_ID,
      page_path,
      page_location: window.location.href,
    });
  }, [pathname, searchParams]);

  return null;
}
