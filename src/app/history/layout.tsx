import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Garage | Repair History | SpotOnAuto',
  description: 'View your saved vehicle diagnostics and repair guides in your personal garage.',
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
