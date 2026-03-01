import { Metadata } from 'next';
import { Suspense } from 'react';
import NewThreadForm from './NewThreadForm';

export const metadata: Metadata = {
    title: 'New Thread — Community Forum | SpotOn Auto',
    description: 'Start a new discussion in the SpotOnAuto community forum.',
    robots: { index: false, follow: true },
};

export default function NewThreadPage() {
    return (
        <main className="min-h-screen pt-24 pb-16">
            <div className="max-w-2xl mx-auto px-4 sm:px-6">
                <Suspense fallback={
                    <div className="glass p-8 rounded-xl text-center">
                        <p className="font-body text-gray-400">Loading...</p>
                    </div>
                }>
                    <NewThreadForm />
                </Suspense>
            </div>
        </main>
    );
}
