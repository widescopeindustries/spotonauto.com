import { Metadata } from 'next';
import ClientHome from './ClientHome';

const OG_IMAGE = 'https://spotonauto.com/og-default.svg';

export const metadata: Metadata = {
  title: 'SpotOnAuto | Free DIY Auto Repair Guides for Your Car',
  description: 'Save hundreds on auto repairs. Get instant AI-generated repair guides for your exact vehicle — step-by-step instructions, parts lists, and pro tips.',
  openGraph: {
    images: [OG_IMAGE],
  },
  twitter: {
    images: [OG_IMAGE],
  },
  alternates: {
    canonical: 'https://spotonauto.com',
  },
};

export default function HomePage() {
  return <ClientHome />;
}
