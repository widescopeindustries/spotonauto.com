'use client';

import Link from 'next/link';
import { Droplets, Zap, Shield, Circle, Paintbrush, Thermometer, Cog, MessageCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
    droplets: Droplets,
    zap: Zap,
    shield: Shield,
    circle: Circle,
    paintbrush: Paintbrush,
    thermometer: Thermometer,
    cog: Cog,
    'message-circle': MessageCircle,
};

interface CategoryCardProps {
    name: string;
    slug: string;
    description: string;
    icon: string;
    threadCount: number;
    postCount: number;
}

export default function CategoryCard({ name, slug, description, icon, threadCount, postCount }: CategoryCardProps) {
    const Icon = ICON_MAP[icon] || MessageCircle;

    return (
        <Link href={`/community/${slug}`} className="block group">
            <div className="glass p-6 rounded-xl border border-white/10 hover:border-cyan-500/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,212,255,0.15)]">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                        <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-display font-bold text-white text-sm tracking-wide group-hover:text-cyan-400 transition-colors">
                            {name}
                        </h3>
                        <p className="font-body text-gray-400 text-xs mt-1 line-clamp-2 leading-relaxed">
                            {description}
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                            <span className="font-mono text-xs text-gray-500">
                                {threadCount} {threadCount === 1 ? 'thread' : 'threads'}
                            </span>
                            <span className="font-mono text-xs text-gray-500">
                                {postCount} {postCount === 1 ? 'reply' : 'replies'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
