'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { CheckCircle2 } from 'lucide-react';
import PopularGuidesSection from '@/components/PopularGuidesSection';

// No Framer Motion in hero — CSS animations only (LCP fix)
const ParticleBackground = dynamic(() => import('@/components/ParticleBackground'), { ssr: false });
const HolographicDashboard = dynamic(() => import('@/components/HolographicDashboard'), { ssr: false, loading: () => <div className="h-64 rounded-2xl bg-white/[0.02] animate-pulse" /> });
const FeaturesSection = dynamic(() => import('@/components/FeaturesSection'));
const HowItWorksSection = dynamic(() => import('@/components/HowItWorksSection'));
const TestimonialsSection = dynamic(() => import('@/components/TestimonialsSection'));
const CTASection = dynamic(() => import('@/components/CTASection'));

// Hero Section Component
const HeroSection = () => {
    const [selectedVehicle, setSelectedVehicle] = React.useState<{ year: string; make: string; model: string } | null>(null);

    return (
        <section id="hero" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 hex-pattern opacity-50" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px]" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left Content */}
                    <div className="space-y-6">
                        {/* Status Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass animate-scale-in">
                            <span className="status-dot" />
                            <span className="font-body text-xs tracking-widest text-cyan-400 uppercase">
                                AI System Online
                            </span>
                        </div>

                        {/* SDVOSB Trust Badge */}
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border" style={{ backgroundColor: 'rgba(212, 160, 23, 0.1)', borderColor: 'rgba(212, 160, 23, 0.4)', color: '#D4A017' }}>
                            🛡️ SDVOSB Certified | Veteran-Owned &amp; Operated
                        </span>

                        {/* Heading — no animation wrapper: renders at full opacity for fast LCP */}
                        <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-tight">
                            <span className="text-white">SILENCE THE</span>
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200 glow-text">
                                CHECK ENGINE
                            </span>
                            <br />
                            <span className="text-white">LIGHT</span>
                        </h1>

                        {/* Subheading */}
                        <p className="font-body text-lg sm:text-xl text-gray-400 max-w-lg">
                            Instant AI Auto Repair. Diagnose problems and get step-by-step fix guides in seconds.
                        </p>

                        {/* Trust Badge */}
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 border-2 border-[#050505] flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-body text-sm text-cyan-400">
                                AI-Powered &middot; <span className="font-bold text-white">Factory Manual Data</span> &middot; Free to Try
                            </span>
                        </div>
                    </div>

                    {/* Right Content - Configuration Panel */}
                    <div className="relative animate-fade-in-right">
                        <div className="glass border border-cyan-500/30 bg-white/[0.02] backdrop-blur-md rounded-2xl glow-border p-6 sm:p-8">
                            {/* Panel Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="font-display font-bold text-xl text-white">
                                        Configuration Panel
                                    </h3>
                                    <p className="font-body text-sm text-gray-400 mt-1">
                                        Select vehicle parameters to calibrate the deep-scan neural network
                                    </p>
                                </div>
                            </div>

                            {/* The Dashboard Component */}
                            <HolographicDashboard onVehicleChange={setSelectedVehicle} />

                            {/* Status Display */}
                            <div className="mt-6 p-4 rounded-lg bg-black/40 border border-cyan-500/10">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-body text-xs text-gray-500 uppercase tracking-widest">
                                        {selectedVehicle?.model ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}` : 'Awaiting Input'}
                                    </span>
                                    <span className="font-body text-xs text-cyan-400 animate-text-flicker">
                                        {selectedVehicle?.model ? 'VEHICLE LOCKED' : 'NO SIGNAL DETECTED'}
                                    </span>
                                </div>
                                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                                    <div className={`h-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all duration-500 ${selectedVehicle?.model ? 'w-full' : 'w-0'}`} />
                                </div>
                            </div>
                        </div>

                        {/* Floating Stats */}
                        <div className="absolute -bottom-4 -right-4 animate-fade-in-up">
                            <div className="glass border border-cyan-500/20 bg-white/[0.02] backdrop-blur-md rounded-2xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                        <CheckCircle2 className="w-6 h-6 text-cyan-400" />
                                    </div>
                                    <div>
                                        <div className="font-display font-bold text-lg text-white">Save $200+</div>
                                        <div className="font-body text-xs text-gray-400 uppercase tracking-wider">
                                            vs. Mechanic Visit
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default function ClientHome() {
    return (
        <div className="relative min-h-screen bg-[#050505] text-white overflow-x-hidden">
            {/* Background Effects */}
            <ParticleBackground />
            <div className="noise-overlay" />
            <div className="scanline-overlay" />

            {/* Main Content */}
            <main className="relative z-10">
                <HeroSection />
                <PopularGuidesSection />
                <FeaturesSection />
                <HowItWorksSection />
                <TestimonialsSection />
                <CTASection />
            </main>
        </div>
    );
}
