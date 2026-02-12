import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live OBD-II Scanner | Browser-Based Vehicle Diagnostics | SpotOnAuto',
  description: 'Connect your ELM327 scanner directly to your browser. Read diagnostic trouble codes (DTCs) and view live engine data for free.',
  alternates: {
    canonical: 'https://spotonauto.com/scanner',
  },
};

export default function ScannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
