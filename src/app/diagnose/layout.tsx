import { Metadata } from 'next';

const OG_IMAGE = 'https://spotonauto.com/og-default.svg';

export const metadata: Metadata = {
  title: 'Diagnostic Core | AI Car Problem Diagnosis | SpotOnAuto',
  description: 'Describe your car symptoms or enter OBD codes to get instant AI-powered diagnostic steps and repair advice.',
  openGraph: {
    images: [OG_IMAGE],
  },
  twitter: {
    images: [OG_IMAGE],
  },
  alternates: {
    canonical: 'https://spotonauto.com/diagnose',
  },
};

export default function DiagnosticLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
