'use client';

import { ReactNode } from 'react';
import { LocaleProvider } from '@/lib/localeContext';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      {children}
    </LocaleProvider>
  );
}
