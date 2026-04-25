import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disclaimer | SpotOnAuto',
  description:
    'Critical DIY safety disclaimer for SpotOnAuto repair guides, AI diagnosis tools, and educational automotive content.',
  alternates: {
    canonical: 'https://spotonauto.com/disclaimer',
  },
};

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-3xl space-y-6 px-4 text-gray-300 sm:px-6">
        <h1 className="text-3xl font-display font-bold text-white">Disclaimer</h1>
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <p className="text-base leading-7 text-red-100">
            SpotOnAuto provides automotive information for educational purposes only. AI-generated
            diagnoses and repair guides are not a substitute for professional mechanical inspection.
            Always consult a certified mechanic before performing repairs that could affect vehicle
            safety. SpotOnAuto and its parent company, Widescope Industries LLC, are not liable for
            damages, injuries, or costs resulting from the use of this information.
          </p>
        </div>
      </div>
    </main>
  );
}
