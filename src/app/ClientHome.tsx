'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { CheckCircle2 } from 'lucide-react';
import PopularGuidesSection from '@/components/PopularGuidesSection';
import { useT } from '@/lib/translations';

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
    const t = useT();

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
                                {t('status.aiOnline')}
                            </span>
                        </div>

                        {/* SDVOSB Trust Badge */}
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border" style={{ backgroundColor: 'rgba(212, 160, 23, 0.1)', borderColor: 'rgba(212, 160, 23, 0.4)', color: '#D4A017' }}>
                            🛡️ SDVOSB Certified | Veteran-Owned &amp; Operated
                        </span>

                        {/* Heading — no animation wrapper: renders at full opacity for fast LCP */}
                        <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-tight">
                            <span className="text-white">{t('hero.silenceThe')}</span>
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200 glow-text">
                                {t('hero.checkEngine')}
                            </span>
                            <br />
                            <span className="text-white">{t('hero.light')}</span>
                        </h1>

                        {/* Subheading */}
                        <p className="font-body text-lg sm:text-xl text-gray-400 max-w-lg">
                            {t('hero.subtitle')}
                        </p>

                        {/* Trust Badge */}
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 border-2 border-[#050505] flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-body text-sm text-cyan-400">
                                {t('hero.aiPowered')} &middot; <span className="font-bold text-white">{t('hero.factoryData')}</span> &middot; {t('hero.free')}
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
                                        {t('hero.configPanel')}
                                    </h3>
                                    <p className="font-body text-sm text-gray-400 mt-1">
                                        {t('hero.configDesc')}
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
                                        {selectedVehicle?.model ? t('status.vehicleLocked') : t('status.noSignal')}
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
                                        <div className="font-display font-bold text-lg text-white">{t('hero.saveMoney')}</div>
                                        <div className="font-body text-xs text-gray-400 uppercase tracking-wider">
                                            {t('hero.vsMechanic')}
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

// Free for the World Banner
const FreeForTheWorldBanner = () => {
    const t = useT();
    return (
        <section className="relative py-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-emerald-500/5 to-cyan-500/5" />
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="border-2 border-cyan-500/40 rounded-2xl overflow-hidden bg-black/60 backdrop-blur-sm">
                    <div className="bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 px-6 py-3 border-b border-cyan-500/30 flex items-center justify-center gap-3">
                        <span className="text-cyan-400 text-sm font-bold uppercase tracking-wider">{t('banner.tagline')}</span>
                    </div>

                    <div className="p-6 sm:p-8 text-center">
                        <h2 className="text-3xl sm:text-4xl font-display font-black text-white mb-2">
                            {t('banner.freeForWorld')}
                        </h2>
                        <p className="text-gray-400 text-lg mb-6 max-w-2xl mx-auto">
                            {t('banner.freeSubtitle')}
                        </p>

                        <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
                            {[
                                { icon: '🔧', label: t('banner.unlimitedGuides'), desc: t('banner.unlimitedDesc') },
                                { icon: '🌍', label: t('banner.languages'), desc: t('banner.languagesDesc') },
                                { icon: '🛡️', label: t('banner.veteran'), desc: t('banner.veteranDesc') },
                            ].map(item => (
                                <div key={item.label} className="border border-cyan-500/20 rounded-xl p-4 bg-cyan-500/5">
                                    <div className="text-2xl mb-2">{item.icon}</div>
                                    <div className="text-white font-bold text-sm">{item.label}</div>
                                    <div className="text-gray-500 text-xs">{item.desc}</div>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
                            <span><CheckCircle2 className="w-3 h-3 inline text-cyan-400 mr-1" />{t('banner.noSignup')}</span>
                            <span><CheckCircle2 className="w-3 h-3 inline text-cyan-400 mr-1" />{t('banner.noCreditCard')}</span>
                            <span><CheckCircle2 className="w-3 h-3 inline text-cyan-400 mr-1" />{t('banner.noLimits')}</span>
                            <span><CheckCircle2 className="w-3 h-3 inline text-cyan-400 mr-1" />{t('banner.manufacturers')}</span>
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
                <FreeForTheWorldBanner />
                <PopularGuidesSection />
                <FeaturesSection />
                <HowItWorksSection />
                <TestimonialsSection />
                <CTASection />
            </main>
        </div>
    );
}
