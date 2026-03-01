'use client';

import Link from 'next/link';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    basePath: string;
}

export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
    if (totalPages <= 1) return null;

    const pages: (number | '...')[] = [];
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== '...') {
            pages.push('...');
        }
    }

    return (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-1 mt-8">
            {pages.map((page, i) =>
                page === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-gray-600 font-mono text-sm">
                        ...
                    </span>
                ) : (
                    <Link
                        key={page}
                        href={page === 1 ? basePath : `${basePath}?page=${page}`}
                        className={`px-3 py-1.5 rounded font-mono text-sm transition-colors ${
                            page === currentPage
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                    >
                        {page}
                    </Link>
                )
            )}
        </nav>
    );
}
