import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Wiring Diagrams | AllOEMManuals',
  description: 'Open thousands of original factory wiring diagrams, electrical schematics, and connector views. Free access for 1982-2025 vehicles, all makes and models.',
  alternates: {
    canonical: 'https://alloemmanuals.com/wiring',
  },
  openGraph: {
    title: 'Free Wiring Diagrams | AllOEMManuals',
    description: 'Open thousands of original factory wiring diagrams, electrical schematics, and connector views. Free access for 1982-2025 vehicles, all makes and models.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'AllOEMManuals - Free DIY Auto Repair Guides' }],
  },
};

export default function WiringLayout({ children }: { children: React.ReactNode }) {
  return children;
}
