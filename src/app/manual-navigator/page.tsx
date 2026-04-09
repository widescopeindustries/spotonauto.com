import type { Metadata } from 'next';
import ManualNavigator from '@/components/ManualNavigator';

export const metadata: Metadata = {
  title: 'Manual Navigator | Factory Manual Archive | SpotOnAuto',
  description:
    'Select a supported vehicle, open the factory manual archive, or generate an archive-grounded repair guide for your exact car or truck.',
  alternates: {
    canonical: 'https://spotonauto.com/manual-navigator',
  },
};

export default function ManualNavigatorPage() {
  return <ManualNavigator />;
}
