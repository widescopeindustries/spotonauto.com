'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Crumb {
    label: string;
    href?: string;
}

interface ForumBreadcrumbsProps {
    crumbs: Crumb[];
}

export default function ForumBreadcrumbs({ crumbs }: ForumBreadcrumbsProps) {
    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-body">
            <Link href="/community" className="text-gray-500 hover:text-cyan-400 transition-colors">
                Community
            </Link>
            {crumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-gray-600" />
                    {crumb.href ? (
                        <Link href={crumb.href} className="text-gray-500 hover:text-cyan-400 transition-colors">
                            {crumb.label}
                        </Link>
                    ) : (
                        <span className="text-gray-400">{crumb.label}</span>
                    )}
                </span>
            ))}
        </nav>
    );
}
