import type { Metadata } from 'next';
import DeferredWiringDiagramBrowser from './DeferredWiringDiagramBrowser';

export const metadata: Metadata = {
  title: 'Wiring Diagrams | AllOEMManuals',
  description: 'Factory wiring diagrams and electrical schematics for 1982-2025 vehicles. Select your year, make, and model to view OEM color-coded diagrams and connector pinouts.',
};

export default function WiringPage() {
  return <DeferredWiringDiagramBrowser />;
}
