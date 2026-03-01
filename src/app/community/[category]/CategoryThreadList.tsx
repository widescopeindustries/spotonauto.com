'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { FadeInUp } from '@/components/MotionWrappers';
import ForumBreadcrumbs from '@/components/forum/ForumBreadcrumbs';
import ThreadListItem from '@/components/forum/ThreadListItem';
import Pagination from '@/components/forum/Pagination';
import type { ForumCategory } from '@/data/forumCategories';

interface Thread {
    id: string;
    title: string;
    slug: string;
    vehicle_year: number | null;
    vehicle_make: string | null;
    vehicle_model: string | null;
    reply_count: number;
    view_count: number;
    is_pinned: boolean;
    created_at: string;
    authorName: string;
}

interface CategoryThreadListProps {
    category: ForumCategory;
    threads: Thread[];
    currentPage: number;
    totalPages: number;
}

export default function CategoryThreadList({ category, threads, currentPage, totalPages }: CategoryThreadListProps) {
    return (
        <main className="min-h-screen pt-24 pb-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <FadeInUp>
                    <ForumBreadcrumbs crumbs={[{ label: category.name }]} />

                    <div className="flex items-center justify-between mt-6 mb-6">
                        <h1 className="font-display font-bold text-2xl text-white tracking-wide">
                            {category.name}
                        </h1>
                        <Link
                            href={`/community/new?category=${category.slug}`}
                            className="btn-cyber-primary inline-flex items-center gap-2 px-4 py-2 text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            New Thread
                        </Link>
                    </div>

                    {threads.length === 0 ? (
                        <div className="glass p-8 rounded-xl text-center">
                            <p className="font-body text-gray-400">No threads yet. Be the first to start a discussion!</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {threads.map((thread) => (
                                <ThreadListItem
                                    key={thread.id}
                                    categorySlug={category.slug}
                                    slug={thread.slug}
                                    title={thread.title}
                                    authorName={thread.authorName}
                                    vehicleYear={thread.vehicle_year}
                                    vehicleMake={thread.vehicle_make}
                                    vehicleModel={thread.vehicle_model}
                                    replyCount={thread.reply_count}
                                    viewCount={thread.view_count}
                                    isPinned={thread.is_pinned}
                                    createdAt={thread.created_at}
                                />
                            ))}
                        </div>
                    )}

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        basePath={`/community/${category.slug}`}
                    />
                </FadeInUp>
            </div>
        </main>
    );
}
