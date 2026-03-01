'use client';

import { FadeInUp } from '@/components/MotionWrappers';
import ForumBreadcrumbs from '@/components/forum/ForumBreadcrumbs';
import ThreadDetail from '@/components/forum/ThreadDetail';
import type { ForumCategory } from '@/data/forumCategories';

interface ThreadPageClientProps {
    thread: {
        id: string;
        title: string;
        body: string;
        created_at: string;
        view_count: number;
        reply_count: number;
        vehicle_year: number | null;
        vehicle_make: string | null;
        vehicle_model: string | null;
        author: { display_name: string; avatar_url: string | null };
    };
    posts: {
        id: string;
        body: string;
        created_at: string;
        author: { display_name: string; avatar_url: string | null };
    }[];
    category: ForumCategory;
}

export default function ThreadPageClient({ thread, posts, category }: ThreadPageClientProps) {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <FadeInUp>
                <ForumBreadcrumbs
                    crumbs={[
                        { label: category.name, href: `/community/${category.slug}` },
                        { label: thread.title },
                    ]}
                />

                <h1 className="font-display font-bold text-2xl text-white tracking-wide mt-6 mb-6">
                    {thread.title}
                </h1>

                <ThreadDetail
                    thread={thread}
                    posts={posts}
                    categorySlug={category.slug}
                />
            </FadeInUp>
        </div>
    );
}
