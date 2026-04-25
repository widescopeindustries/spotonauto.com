import { Metadata } from 'next';
import { FORUM_CATEGORIES } from '@/data/forumCategories';
import CommunityHome from './CommunityHome';
import { getForumCategoryCounts } from '@/data/forumThreads';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Community Forum — SpotOn Auto | DIY Auto Repair Discussions',
  description:
    'Join the SpotOnAuto community forum. Ask questions, share repair tips, and get help from fellow DIY mechanics on oil changes, brakes, engines, and more.',
  keywords: ['auto repair forum', 'DIY mechanic community', 'car repair help', 'vehicle maintenance discussion'],
  openGraph: {
    title: 'Community Forum — SpotOn Auto',
    description: 'Join the SpotOnAuto community. Ask questions, share tips, and help fellow DIY mechanics.',
    url: 'https://spotonauto.com/community',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'SpotOnAuto - Free DIY Auto Repair Guides' }],
  },
  alternates: { canonical: 'https://spotonauto.com/community' },
};

export default async function CommunityPage() {
  const categories = FORUM_CATEGORIES.map((cat) => ({
    ...cat,
    ...getForumCategoryCounts(cat.slug),
  }));

  return <CommunityHome categories={categories} />;
}
