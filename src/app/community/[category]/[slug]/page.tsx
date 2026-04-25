import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategoryBySlug } from '@/data/forumCategories';
import { getThreadByCategoryAndSlug } from '@/data/forumThreads';
import ThreadDetail from '@/components/forum/ThreadDetail';

interface PageProps {
  params: Promise<{ category: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: catSlug, slug } = await params;
  const cat = getCategoryBySlug(catSlug);
  if (!cat) return {};

  return {
    title: `${cat.name} Thread — SpotOn Auto Community`,
    description: 'Community discussion thread for DIY auto repair troubleshooting, tools, and vehicle-specific fixes.',
    alternates: { canonical: `https://spotonauto.com/community/${catSlug}/${slug}` },
  };
}

export default async function ThreadPage({ params }: PageProps) {
  const { category: catSlug, slug } = await params;
  const cat = getCategoryBySlug(catSlug);
  if (!cat) notFound();
  const thread = getThreadByCategoryAndSlug(catSlug, slug);
  if (!thread) notFound();

  return (
    <main className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-white mb-4">{cat.name}</h1>
        <ThreadDetail
          categorySlug={catSlug}
          thread={thread}
          posts={thread.posts}
        />
      </div>
    </main>
  );
}
