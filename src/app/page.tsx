import { Metadata } from 'next';
import ClientHome from './ClientHome';
import { getHomepageMomentumData } from '@/lib/commandCenterOpportunities';

const OG_IMAGE = 'https://spotonauto.com/og-default.svg';
const HOME_URL = 'https://spotonauto.com';

function toAbsoluteUrl(href: string): string {
  if (href.startsWith('http://') || href.startsWith('https://')) return href;
  return `${HOME_URL}${href.startsWith('/') ? href : `/${href}`}`;
}

function buildHomeStructuredData(popularRepairLinks: Array<{ href: string; label: string }>) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${HOME_URL}/#webpage`,
        url: HOME_URL,
        name: 'SpotOnAuto',
        description:
          'Free DIY auto repair guides, diagnosis, and parts help for battery replacement, brakes, alternators, belts, thermostats, and other common repairs.',
        isPartOf: {
          '@id': `${HOME_URL}/#website`,
        },
        mainEntity: {
          '@id': `${HOME_URL}/#repairs`,
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${HOME_URL}/#website`,
        url: HOME_URL,
        name: 'SpotOnAuto',
      },
      {
        '@type': 'ItemList',
        '@id': `${HOME_URL}/#repairs`,
        name: 'Popular repair guides',
        itemListElement: popularRepairLinks.slice(0, 5).map((link, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: toAbsoluteUrl(link.href),
          name: link.label,
        })),
      },
      {
        '@type': 'FAQPage',
        '@id': `${HOME_URL}/#faq`,
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Can I find a repair guide even if I only know the symptom?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Start with SpotOnAuto diagnosis to map symptoms like a battery light, overheating, or brake noise to the likely repair before opening the guide.',
            },
          },
          {
            '@type': 'Question',
            name: 'Does SpotOnAuto cover common repairs like batteries, belts, and brakes?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. The homepage links directly to high-intent repair pages for battery replacement, serpentine belts, alternators, brake pads, thermostats, spark plugs, and similar jobs.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I compare parts before starting the repair?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Use the parts comparison area to research common replacement parts before you buy or begin teardown.',
            },
          },
        ],
      },
    ],
  };
}

export const metadata: Metadata = {
  title: 'SpotOnAuto | Free DIY Auto Repair Guides, Diagnosis, and Parts Help',
  description:
    'Save hundreds on auto repairs with free DIY guides, symptom-based diagnosis, and parts help for batteries, brakes, alternators, serpentine belts, thermostats, and more.',
  openGraph: {
    images: [OG_IMAGE],
  },
  twitter: {
    images: [OG_IMAGE],
  },
  alternates: {
    canonical: 'https://spotonauto.com',
  },
};

export default async function HomePage() {
  const homepageMomentum = getHomepageMomentumData();
  const homeStructuredData = buildHomeStructuredData(homepageMomentum.popularRepairLinks);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeStructuredData) }}
      />
      <ClientHome />
    </>
  );
}
