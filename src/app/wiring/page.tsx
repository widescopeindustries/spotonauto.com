import { getWiringSelectorData } from '@/lib/wiringCoverage';

import WiringDiagramLibrary from './WiringDiagramLibrary';

export default function WiringPage() {
  return <WiringDiagramLibrary selectorData={getWiringSelectorData()} />;
}
