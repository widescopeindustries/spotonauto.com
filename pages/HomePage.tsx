import React from 'react';
import HolographicDashboard from '../components/HolographicDashboard';
import SEOHead from '../components/seo/SEOHead';

const HomePage: React.FC = () => {
    return (
        <>
            <SEOHead
                title="AI Auto Repair Assistant | Instant Diagnostics & DIY Guides"
                description="Expert AI Auto Repair help for 450K+ vehicles. Get instant diagnostics, step-by-step repair guides, and labor cost estimates. Fix your car today."
                keywords="auto repair, car repair, check engine light, mechanic, car diagnostics, auto mechanic, vehicle repair, car maintenance"
                canonicalUrl="https://ai-auto-repair-mobile.vercel.app/"
            />

            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-[100px] animate-pulse-slow"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-amber/5 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
                </div>

                <div className="z-10 text-center mb-12">
                    <h1 className="text-4xl md:text-6xl font-bold font-mono text-white mb-4 tracking-tighter text-glow">
                        SILENCE THE <br />
                        <span className="text-neon-amber">CHECK ENGINE LIGHT</span>
                    </h1>
                    <p className="text-gray-400 text-lg md:text-xl font-mono tracking-wide max-w-2xl mx-auto">
                        INSTANT DIAGNOSTICS. POWERED BY <span className="text-neon-cyan">HYPER-INTELLIGENCE</span>.
                    </p>
                </div>

                <HolographicDashboard />

                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center z-10">
                    {['Zero-Friction UI', 'Predictive Analysis', 'Visual AR Guides'].map((feature) => (
                        <div key={feature} className="p-4 border border-white/5 rounded-lg backdrop-blur-sm bg-black/20 hover:border-neon-cyan/30 transition-colors">
                            <span className="text-neon-cyan font-mono text-sm tracking-widest uppercase">{feature}</span>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default HomePage;
