import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact SpotOnAuto | Support & Questions',
  description:
    'Have questions about SpotOnAuto or need help with a repair guide? Reach out to our veteran-owned support team for assistance with diagnostics, guides, or tools.',
  alternates: {
    canonical: 'https://spotonauto.com/contact',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
