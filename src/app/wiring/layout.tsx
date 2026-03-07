import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Wiring Diagrams | SpotOnAuto',
  description: 'Browse thousands of original factory wiring diagrams, electrical schematics, and connector views. Free access for 1982-2013 vehicles, all makes and models.',
  alternates: {
    canonical: 'https://spotonauto.com/wiring',
  },
  openGraph: {
    title: 'Free Wiring Diagrams | SpotOnAuto',
    description: 'Original factory wiring diagrams for 1982-2013 vehicles. Searchable by make, year, and model.',
  },
};

export default function WiringLayout({ children }: { children: React.ReactNode }) {
  return children;
}
