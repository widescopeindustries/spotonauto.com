export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import TestInteractiveClient from './TestInteractiveClient';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function TestInteractivePage() {
  return <TestInteractiveClient />;
}
