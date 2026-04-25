import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategoryBySlug, FORUM_CATEGORIES } from '@/data/forumCategories';
import { getThreadsByCategory } from '@/data/forumThreads';
import ThreadListItem from '@/components/forum/ThreadListItem';
import Pagination from '@/components/forum/Pagination';

const THREADS_PER_PAGE = 20;

interface PageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateStaticParams() {
  return FORUM_CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) return {};

  return {
    title: `${cat.name} — Community Forum | SpotOn Auto`,
    description: `Community discussions for ${cat.name.toLowerCase()}.`,
    alternates: { canonical: `https://spotonauto.com/community/${slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { category: slug } = await params;
  const { page: pageStr } = await searchParams;
  const cat = getCategoryBySlug(slug);
  if (!cat) notFound();
  const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1);
  const threads = getThreadsByCategory(slug);
  const totalPages = Math.max(1, Math.ceil(threads.length / THREADS_PER_PAGE));
  const offset = (page - 1) * THREADS_PER_PAGE;
  const pageThreads = threads.slice(offset, offset + THREADS_PER_PAGE);

  return (
    <main className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-4">{cat.name}</h1>
        <p className="text-gray-400 mb-3">
          Reading is open. Posting requires an account and moderator approval during migration hardening.
        </p>
        <p className="text-xs text-gray-500 mb-6">
          Moderation rules: include year/make/model, avoid unsafe advice without warnings, and keep replies respectful.
        </p>
        <div className="glass rounded-xl p-4">
          {pageThreads.length === 0 ? (
            <p className="p-4 text-gray-400">No threads found in this category yet.</p>
          ) : (
            <div className="space-y-2">
              {pageThreads.map((thread) => (
                <ThreadListItem
                  key={thread.id}
                  categorySlug={thread.categorySlug}
                  slug={thread.slug}
                  title={thread.title}
                  authorName={thread.author.display_name}
                  vehicleYear={thread.vehicle_year}
                  vehicleMake={thread.vehicle_make}
                  vehicleModel={thread.vehicle_model}
                  replyCount={thread.reply_count}
                  viewCount={thread.view_count}
                  isPinned={thread.isPinned}
                  createdAt={thread.created_at}
                />
              ))}
            </div>
          )}
        </div>
        <Pagination currentPage={page} totalPages={totalPages} basePath={`/community/${slug}`} />
      </div>
    </main>
  );
}
