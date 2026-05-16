'use client';

import { ReactNode } from 'react';
import { LocaleProvider } from '@/lib/localeContext';
import SmoothScroll from './SmoothScroll';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <SmoothScroll>
        {children}
      </SmoothScroll>
    </LocaleProvider>
  );
}
