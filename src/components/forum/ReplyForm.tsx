'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

interface ReplyFormProps {
    threadId: string;
}

export default function ReplyForm({ threadId }: ReplyFormProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [body, setBody] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!user) {
        return (
            <div className="glass p-6 rounded-xl text-center">
                <p className="font-body text-gray-400 text-sm mb-3">Sign in to reply to this thread</p>
                <button
                    onClick={() => router.push(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`)}
                    className="btn-cyber text-sm"
                >
                    Sign In
                </button>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!body.trim() || submitting) return;
        setSubmitting(true);
        setError('');

        const { error: insertError } = await supabase
            .from('forum_posts')
            .insert({ thread_id: threadId, author_id: user.id, body: body.trim() });

        if (insertError) {
            setError('Failed to post reply. Please try again.');
            setSubmitting(false);
            return;
        }

        setBody('');
        setSubmitting(false);
        router.refresh();
    };

    return (
        <form onSubmit={handleSubmit} className="glass p-4 rounded-xl">
            <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your reply..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 resize-none"
            />
            {error && <p className="text-red-400 text-xs mt-2 font-body">{error}</p>}
            <div className="flex justify-end mt-3">
                <button
                    type="submit"
                    disabled={!body.trim() || submitting}
                    className="btn-cyber-primary flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Posting...' : 'Post Reply'}
                </button>
            </div>
        </form>
    );
}
