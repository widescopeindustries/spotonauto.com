import { Metadata } from 'next';
import PricingContent from './PricingContent';

export const metadata: Metadata = {
  title: 'Pricing | SpotOn Auto - Unlock Unlimited AI Diagnostics',
  description: 'Upgrade to SpotOn Auto Pro for unlimited AI diagnostics, OBD-II scanner integration, and priority support. Start fixing your car like a pro.',
  alternates: {
    canonical: 'https://spotonauto.com/pricing',
  },
};

export default function PricingPage() {
  return <PricingContent />;
}
