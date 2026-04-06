import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Garage | Repair History | SpotOnAuto',
  description: 'View your saved vehicle diagnostics, repair guides, and maintenance history in your personal garage. Track past repairs and pick up where you left off.',
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: 'https://spotonauto.com/history',
  },
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
