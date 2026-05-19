'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log to console in development; production logging should go to a service
        if (process.env.NODE_ENV === 'development') {
            console.error('App error:', error);
        }
    }, [error]);

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
                Something went wrong
            </h2>
            <p className="text-gray-400 mb-8 max-w-md">
                We encountered an error loading this page. Please try again or go back to the homepage.
            </p>
            <div className="flex gap-4">
                <button
                    onClick={reset}
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
                >
                    Try again
                </button>
                <a
                    href="/"
                    className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                >
                    Go home
                </a>
            </div>
        </div>
    );
}
