'use client';

import React, { useState, useEffect } from 'react';
import { X, Lock, Zap } from 'lucide-react';

interface GatedUpgradeBannerProps {
    onDismiss?: () => void;
}

const STRIPE_PRO_LINK = 'https://buy.stripe.com/cNi14na6t8iycykeo718c08';

const GatedUpgradeBanner: React.FC<GatedUpgradeBannerProps> = ({ onDismiss }) => {
    const [isDismissed, setIsDismissed] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            if (isDismissed) {
                // Re-show banner after scrolling 300px
                if (window.scrollY > 300) {
                    setIsVisible(true);
                    setIsDismissed(false);
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isDismissed]);

    const handleDismiss = () => {
        setIsDismissed(true);
        setIsVisible(false);
        onDismiss?.();
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
            <div className="max-w-4xl mx-auto px-4 pb-4">
                <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl shadow-2xl shadow-cyan-500/10">
                    {/* Animated gradient border effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-amber-500/10 to-cyan-500/10 animate-pulse" />

                    <div className="relative px-6 py-4 flex items-center gap-4">
                        {/* Icon */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-amber-500/20 flex items-center justify-center border border-cyan-500/30">
                            <Lock className="w-5 h-5 text-cyan-400" />
                        </div>

                        {/* Text content */}
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-sm md:text-base">
                                You&apos;re viewing a preview
                            </p>
                            <p className="text-gray-400 text-xs md:text-sm mt-0.5">
                                Upgrade to Pro for exact part numbers, torque specs, and measurements
                            </p>
                        </div>

                        {/* CTA Button */}
                        <a
                            href={STRIPE_PRO_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-400 text-gray-900 font-bold text-sm rounded-xl hover:from-cyan-400 hover:to-cyan-300 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/30 hover:scale-105 active:scale-95"
                        >
                            <Zap className="w-4 h-4" />
                            <span className="hidden sm:inline">Unlock Full Guide</span>
                            <span className="sm:hidden">Unlock</span>
                            <span className="hidden md:inline text-cyan-900/80">— $9.99/mo</span>
                        </a>

                        {/* Dismiss button */}
                        <button
                            onClick={handleDismiss}
                            className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-300 transition-colors"
                            aria-label="Dismiss"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes slide-up {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .animate-slide-up {
                    animation: slide-up 0.4s ease-out;
                }
            `}</style>
        </div>
    );
};

export default GatedUpgradeBanner;
