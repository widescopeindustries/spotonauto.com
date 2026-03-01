'use client';

import Link from 'next/link';
import { Plus, MessageCircle } from 'lucide-react';
import CategoryCard from '@/components/forum/CategoryCard';
import { FadeInUp, StaggerContainer, StaggerItem } from '@/components/MotionWrappers';

interface CategoryWithCounts {
    name: string;
    slug: string;
    description: string;
    icon: string;
    threadCount: number;
    postCount: number;
}

interface CommunityHomeProps {
    categories: CategoryWithCounts[];
}

export default function CommunityHome({ categories }: CommunityHomeProps) {
    return (
        <main className="min-h-screen pt-24 pb-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                {/* Hero */}
                <FadeInUp>
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 mb-4">
                            <MessageCircle className="w-4 h-4 text-cyan-400" />
                            <span className="font-mono text-xs text-cyan-400">COMMUNITY FORUM</span>
                        </div>
                        <h1 className="font-display font-bold text-3xl md:text-4xl text-white tracking-wide">
                            DIY <span className="text-cyan-400">Auto Repair</span> Community
                        </h1>
                        <p className="font-body text-gray-400 mt-3 max-w-lg mx-auto">
                            Ask questions, share repair tips, and help fellow mechanics.
                            Every thread is a free resource for the community.
                        </p>
                        <Link
                            href="/community/new"
                            className="btn-cyber-primary inline-flex items-center gap-2 mt-6 px-5 py-2.5 text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            New Thread
                        </Link>
                    </div>
                </FadeInUp>

                {/* Category grid */}
                <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map((cat) => (
                        <StaggerItem key={cat.slug}>
                            <CategoryCard
                                name={cat.name}
                                slug={cat.slug}
                                description={cat.description}
                                icon={cat.icon}
                                threadCount={cat.threadCount}
                                postCount={cat.postCount}
                            />
                        </StaggerItem>
                    ))}
                </StaggerContainer>
            </div>
        </main>
    );
}
