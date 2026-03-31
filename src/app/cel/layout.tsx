import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Check Engine Light Lookup | SpotOnAuto',
  description:
    'Look up any check engine light code instantly. Free OBD2 code lookup with plain-English causes, symptoms, severity ratings, and step-by-step DIY fix guides.',
  alternates: {
    canonical: 'https://spotonauto.com/cel',
  },
};

/**
 * CEL landing page layout - strips header/footer for ad traffic.
 * No nav links = no exit points = higher conversion.
 */
export default function CELLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
