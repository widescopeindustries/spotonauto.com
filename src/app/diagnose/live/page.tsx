import { Metadata } from 'next';
import LiveDiagnosticClient from './LiveDiagnosticClient';

export const metadata: Metadata = {
  title: 'Live Vehicle Diagnostics — SpotOn Auto',
  description: 'Connect your OBD2 scanner and diagnose your vehicle in real-time with AI-powered OEM diagnostic procedures.',
  robots: { index: false }, // Keep private during prototype
};

export default function LiveDiagnosticPage() {
  return <LiveDiagnosticClient />;
}
