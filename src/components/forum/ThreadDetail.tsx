'use client';

import { useEffect } from 'react';
import { User, Clock, Eye, MessageSquare, Car } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { timeAgo } from '@/lib/forumUtils';
import ReplyForm from './ReplyForm';

interface Post {
    id: string;
    body: string;
    created_at: string;
    author: { display_name: string; avatar_url: string | null };
}

interface ThreadDetailProps {
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
    posts: Post[];
    categorySlug: string;
}

function slugifyForRepair(s: string) {
    return s.toLowerCase().replace(/\s+/g, '-');
}

export default function ThreadDetail({ thread, posts, categorySlug }: ThreadDetailProps) {
    useEffect(() => {
        supabase.rpc('increment_thread_views', { p_thread_id: thread.id }).then(() => {});
    }, [thread.id]);

    const hasVehicle = thread.vehicle_year && thread.vehicle_make && thread.vehicle_model;

    return (
        <div className="space-y-6">
            {/* Thread body */}
            <div className="glass p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        {thread.author.avatar_url ? (
                            <img src={thread.author.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                            <User className="w-4 h-4 text-cyan-400" />
                        )}
                    </div>
                    <div>
                        <span className="font-body text-sm text-white">{thread.author.display_name}</span>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span className="font-mono">{timeAgo(thread.created_at)}</span>
                        </div>
                    </div>
                    <div className="ml-auto flex items-center gap-3 text-gray-500">
                        <span className="flex items-center gap-1 font-mono text-xs">
                            <Eye className="w-3.5 h-3.5" /> {thread.view_count}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-xs">
                            <MessageSquare className="w-3.5 h-3.5" /> {thread.reply_count}
                        </span>
                    </div>
                </div>

                {hasVehicle && (
                    <div className="flex items-center gap-2 mb-4">
                        <span className="bg-cyan-500/20 text-cyan-300 text-xs rounded font-mono px-2 py-1 flex items-center gap-1.5">
                            <Car className="w-3 h-3" />
                            {thread.vehicle_year} {thread.vehicle_make} {thread.vehicle_model}
                        </span>
                    </div>
                )}

                <div className="font-body text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {thread.body}
                </div>

                {/* Vehicle repair links */}
                {hasVehicle && (
                    <div className="mt-6 pt-4 border-t border-white/5">
                        <p className="font-display text-xs text-gray-500 uppercase tracking-widest mb-2">
                            Related Repair Guides
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {['oil-change', 'brake-pad-replacement', 'battery-replacement', 'spark-plug-replacement'].map((task) => (
                                <Link
                                    key={task}
                                    href={`/repair/${thread.vehicle_year}/${slugifyForRepair(thread.vehicle_make!)}/${slugifyForRepair(thread.vehicle_model!)}/${task}`}
                                    className="text-xs font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 rounded px-2 py-1 transition-colors"
                                >
                                    {task.replace(/-/g, ' ')}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Replies */}
            {posts.length > 0 && (
                <div className="space-y-3">
                    <h3 className="font-display text-sm text-white tracking-wide">
                        {posts.length} {posts.length === 1 ? 'Reply' : 'Replies'}
                    </h3>
                    {posts.map((post) => (
                        <div key={post.id} className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-cyan-500/10 flex items-center justify-center">
                                    {post.author.avatar_url ? (
                                        <img src={post.author.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                                    ) : (
                                        <User className="w-3 h-3 text-cyan-400" />
                                    )}
                                </div>
                                <span className="font-body text-xs text-white">{post.author.display_name}</span>
                                <span className="font-mono text-xs text-gray-500">{timeAgo(post.created_at)}</span>
                            </div>
                            <div className="font-body text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {post.body}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Reply form */}
            <ReplyForm threadId={thread.id} />
        </div>
    );
}
