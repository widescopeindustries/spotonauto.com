import type { Metadata } from 'next';
import DeferredWiringDiagramBrowser from './DeferredWiringDiagramBrowser';

export const metadata: Metadata = {
  title: 'Wiring Diagrams | AllOEMManuals',
  description: 'Factory wiring diagrams and electrical schematics for 1982-2025 vehicles. Select your exact year, make, and model to view OEM diagrams.',
};

export default function WiringPage() {
  return <DeferredWiringDiagramBrowser />;
}
