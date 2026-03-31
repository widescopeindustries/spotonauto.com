import { Metadata } from 'next';

const OG_IMAGE = 'https://spotonauto.com/og-default.svg';

export const metadata: Metadata = {
  title: 'AI Car Diagnosis | Describe Your Problem, Get Answers | SpotOnAuto',
  description: 'Describe your car symptoms or enter OBD2 trouble codes for instant AI-powered diagnosis. Get likely causes, repair steps, and cost estimates for your exact vehicle.',
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
