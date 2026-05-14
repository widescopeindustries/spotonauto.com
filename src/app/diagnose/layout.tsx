import { Metadata } from 'next';

const OG_IMAGE = 'https://alloemmanuals.com/og-default.svg';

export const metadata: Metadata = {
  title: 'Manuel — AI Factory Mechanic | Diagnose Your Car with OEM Data | AllOEMManuals',
  description: 'Talk to Manuel, your factory-trained AI mechanic. Describe symptoms, read codes aloud, or ask repair questions. Grounded in real OEM service manuals for your exact year, make, and model.',
  openGraph: {
    images: [OG_IMAGE],
  },
  twitter: {
    images: [OG_IMAGE],
  },
  alternates: {
    canonical: 'https://alloemmanuals.com/diagnose',
  },
};

export default function DiagnosticLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
