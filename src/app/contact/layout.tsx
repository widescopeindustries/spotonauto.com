import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact SpotOnAuto | Support & Questions',
  description:
    'Have questions about SpotOnAuto or need help with a repair guide? Reach out to our support team and we will get back to you quickly.',
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
