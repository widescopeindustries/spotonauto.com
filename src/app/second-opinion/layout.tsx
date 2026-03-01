import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mechanic Quote Checker — Get a Free 2nd Opinion | SpotOnAuto',
  description:
    'Is your mechanic overcharging you? Get an AI-powered 2nd opinion on any auto repair quote. Free instant analysis for your specific vehicle.',
  alternates: {
    canonical: 'https://spotonauto.com/second-opinion',
  },
  openGraph: {
    title: 'Mechanic Quote Checker — Get a Free 2nd Opinion | SpotOnAuto',
    description:
      'Is your mechanic overcharging you? Get an AI-powered 2nd opinion on any auto repair quote. Free instant analysis for your specific vehicle.',
    url: 'https://spotonauto.com/second-opinion',
    type: 'website',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does the mechanic quote checker work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Enter your vehicle details, what your mechanic diagnosed, and the quoted price. Our AI compares the quote against average repair costs for your specific vehicle, identifies common misdiagnoses, and gives you a verdict: Fair Price, Seems High, Red Flag, or Seems Low.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the 2nd opinion tool free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Yes! It's completely free with unlimited checks for all users.",
      },
    },
    {
      '@type': 'Question',
      name: 'How accurate is the AI mechanic quote analysis?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our AI analyzes thousands of data points including average repair costs, regional labor rates ($80-$150/hr), OEM vs aftermarket parts pricing, and common mechanic upsells. While not a substitute for a professional inspection, it helps you know the right questions to ask. All features are available to every user for free.',
      },
    },
    {
      '@type': 'Question',
      name: 'What does "Red Flag" mean on a mechanic quote?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A Red Flag verdict means the quoted price is 50% or more above the typical range for that repair, OR the diagnosis itself seems suspicious or potentially unnecessary. We recommend getting a second in-person opinion before proceeding.',
      },
    },
    {
      '@type': 'Question',
      name: 'What does "Seems Low" mean on a mechanic quote?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A "Seems Low" verdict means the quoted price is significantly below what this repair typically costs. This could indicate the use of lower-quality parts, an incomplete repair, or that corners may be cut. Ask your mechanic about parts quality and warranty.',
      },
    },
  ],
};

export default function SecondOpinionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  );
}
