import type { Metadata } from 'next';
import Link from 'next/link';
import ConversionZone from '@/components/ConversionZone';
import AuthorBioCard from '@/components/AuthorBioCard';

const PAGE_URL = 'https://spotonauto.com/blog/amazon-auto-parts-by-vehicle-year-and-type';

export const metadata: Metadata = {
  title: 'Amazon Auto Parts by Vehicle Year and Type | SpotOnAuto',
  description:
    'How to find Amazon auto parts by vehicle year, make, model, and repair type without ordering the wrong fitment.',
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: 'Amazon Auto Parts by Vehicle Year and Type | SpotOnAuto',
    description:
      'Use Amazon Garage correctly: year/make/model fitment, part number checks, and ordering workflow.',
    type: 'article',
    url: PAGE_URL,
  },
};

export default function AmazonAutoPartsPage() {
  const schemaDate = new Date().toISOString().slice(0, 10);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Amazon Auto Parts by Vehicle Year and Type',
    datePublished: schemaDate,
    dateModified: schemaDate,
    author: { '@type': 'Person', name: 'SpotOnAuto Editorial Team' },
    publisher: {
      '@type': 'Organization',
      name: 'SpotOnAuto',
      logo: { '@type': 'ImageObject', url: 'https://spotonauto.com/logo.png' },
    },
    mainEntityOfPage: PAGE_URL,
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I search Amazon auto parts by vehicle year and type?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Start by adding your exact year, make, model, and engine in Amazon Garage. Then search by repair type and filter to fitment-verified listings.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is Amazon fitment always correct?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No system is perfect. Always cross-check part numbers, connector style, and dimensions against OEM references before purchase.',
        },
      },
    ],
  };

  return (
    <main className="min-h-screen px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="mx-auto max-w-4xl">
        <nav className="mb-5 text-sm text-gray-500">
          <Link href="/" className="hover:text-cyan-300">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:text-cyan-300">Blog</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-300">Amazon Auto Parts by Vehicle Year and Type</span>
        </nav>

        <h1 className="text-3xl font-bold text-white sm:text-4xl">Amazon Auto Parts by Vehicle Year and Type</h1>
        <p className="mt-3 text-gray-300">
          Quick answer: use Amazon Garage with your exact year, make, model, and engine before selecting parts.
          Then filter to fitment-verified listings and cross-check OEM part numbers.
        </p>

        <div className="answer-box">
          <h2>Fast Workflow</h2>
          <table className="spec-table">
            <thead>
              <tr>
                <th>Step</th>
                <th>Action</th>
                <th>Why</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>1</td><td>Add vehicle to Amazon Garage</td><td>Enables fitment filters</td></tr>
              <tr><td>2</td><td>Search by repair type + part</td><td>Narrows to relevant listings</td></tr>
              <tr><td>3</td><td>Filter to “Fits your vehicle”</td><td>Reduces ordering mistakes</td></tr>
              <tr><td>4</td><td>Verify OEM part number</td><td>Confirms final compatibility</td></tr>
            </tbody>
          </table>
        </div>

        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-gray-300">
          <h2 className="text-xl font-semibold text-white">Before You Order</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
            <li>Match engine and trim, not just make/model.</li>
            <li>Compare connector shapes and dimensions in product photos.</li>
            <li>Check whether gaskets, clips, or bolts are included.</li>
            <li>Confirm return policy for wrong-fit items.</li>
          </ul>
        </section>

        <ConversionZone vehicleLabel="your vehicle" intentLabel="amazon auto parts fitment" />
        <AuthorBioCard updatedDate={schemaDate} />
      </div>
    </main>
  );
}
