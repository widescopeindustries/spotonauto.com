'use client';

import Link from 'next/link';
import { MessageSquare, Eye, Pin } from 'lucide-react';
import { timeAgo } from '@/lib/forumUtils';

interface ThreadListItemProps {
    categorySlug: string;
    slug: string;
    title: string;
    authorName: string;
    vehicleYear?: number | null;
    vehicleMake?: string | null;
    vehicleModel?: string | null;
    replyCount: number;
    viewCount: number;
    isPinned: boolean;
    createdAt: string;
}

export default function ThreadListItem({
    categorySlug,
    slug,
    title,
    authorName,
    vehicleYear,
    vehicleMake,
    vehicleModel,
    replyCount,
    viewCount,
    isPinned,
    createdAt,
}: ThreadListItemProps) {
    const hasVehicle = vehicleYear && vehicleMake && vehicleModel;

    return (
        <Link
            href={`/community/${categorySlug}/${slug}`}
            className="block group"
        >
            <div className="flex items-center gap-4 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 hover:bg-white/[0.04] transition-all duration-200">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        {isPinned && (
                            <Pin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        )}
                        <h3 className="font-body text-sm text-white group-hover:text-cyan-400 transition-colors truncate">
                            {title}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="font-body text-xs text-gray-500">by {authorName}</span>
                        <span className="text-gray-600 text-xs">&middot;</span>
                        <span className="font-mono text-xs text-gray-500">{timeAgo(createdAt)}</span>
                        {hasVehicle && (
                            <>
                                <span className="text-gray-600 text-xs">&middot;</span>
                                <span className="bg-cyan-500/20 text-cyan-300 text-xs rounded font-mono px-1.5 py-0.5">
                                    {vehicleYear} {vehicleMake} {vehicleModel}
                                </span>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="flex items-center gap-1 text-gray-500">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="font-mono text-xs">{replyCount}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                        <Eye className="w-3.5 h-3.5" />
                        <span className="font-mono text-xs">{viewCount}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
