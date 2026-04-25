'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Send } from 'lucide-react';
import { FORUM_CATEGORIES } from '@/data/forumCategories';
import { FadeInUp } from '@/components/MotionWrappers';
import ForumBreadcrumbs from '@/components/forum/ForumBreadcrumbs';
import AuthProviders from '@/components/AuthProviders';

function NewThreadFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categorySlug, setCategorySlug] = useState(searchParams.get('category') ?? '');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  return (
    <FadeInUp>
      <ForumBreadcrumbs crumbs={[{ label: 'New Thread' }]} />

      <h1 className="font-display font-bold text-2xl text-white tracking-wide mt-6 mb-6">
        Start a New Thread
      </h1>

      <div className="glass p-6 rounded-xl space-y-5">
        <p className="text-gray-300">
          Reading is open for everyone. Posting requires a signed-in account and moderator review while we finish migration hardening.
        </p>

        <div>
          <label className="block font-body text-sm text-gray-400 mb-1.5">Category</label>
          <select value={categorySlug} disabled className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 font-body text-sm text-white opacity-60">
            <option value="" className="bg-gray-900">Select a category...</option>
            {FORUM_CATEGORIES.map((cat) => (
              <option key={cat.slug} value={cat.slug} className="bg-gray-900">
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-body text-sm text-gray-400 mb-1.5">Title</label>
          <input value={title} disabled className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 font-body text-sm text-white opacity-60" />
        </div>

        <div>
          <label className="block font-body text-sm text-gray-400 mb-1.5">Description</label>
          <textarea value={body} disabled rows={6} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body text-sm text-white opacity-60 resize-none" />
        </div>

        <div className="text-sm text-gray-500">
          Moderation guidelines: include year/make/model, avoid unsafe instructions without warnings, and keep discussions respectful.
        </div>

        <button
          type="button"
          onClick={() => router.push('/community')}
          className="btn-cyber-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <Send className="w-4 h-4" />
          Back to Community
        </button>
      </div>
    </FadeInUp>
  );
}

export default function NewThreadForm() {
  return (
    <AuthProviders>
      <NewThreadFormInner />
    </AuthProviders>
  );
}
