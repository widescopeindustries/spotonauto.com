import { Metadata } from 'next';
import ClientHome from './ClientHome';

const OG_IMAGE = 'https://spotonauto.com/og-default.svg';
const HOME_URL = 'https://spotonauto.com';

const homeStructuredData = {
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
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          url: `${HOME_URL}/repair/2013/bmw/x3/battery-replacement`,
          name: '2013 BMW X3 battery replacement',
        },
        {
          '@type': 'ListItem',
          position: 2,
          url: `${HOME_URL}/repair/2009/bmw/x5/serpentine-belt-replacement`,
          name: '2009 BMW X5 serpentine belt diagram',
        },
        {
          '@type': 'ListItem',
          position: 3,
          url: `${HOME_URL}/repair/2013/honda/odyssey/alternator-replacement`,
          name: '2013 Honda Odyssey alternator replacement',
        },
        {
          '@type': 'ListItem',
          position: 4,
          url: `${HOME_URL}/repair/2013/bmw/x3/brake-pad-replacement`,
          name: '2013 BMW X3 brake pad replacement',
        },
        {
          '@type': 'ListItem',
          position: 5,
          url: `${HOME_URL}/repair/2013/bmw/x3/thermostat-replacement`,
          name: '2013 BMW X3 thermostat replacement',
        },
      ],
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

export default function HomePage() {
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
