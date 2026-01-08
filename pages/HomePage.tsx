import React from 'react';
import HolographicDashboard from '../components/HolographicDashboard';
import SEOHead from '../components/seo/SEOHead';

const HomePage: React.FC = () => {
    const [selectedVehicle, setSelectedVehicle] = React.useState<{ year: string; make: string; model: string } | null>(null);

    // Determine which image to show based on heuristics
    const getCarImage = () => {
        if (!selectedVehicle || !selectedVehicle.model) return null;
        const modelLower = selectedVehicle.model.toLowerCase();

        if (modelLower.includes('f-150') || modelLower.includes('silverado') || modelLower.includes('ram') || modelLower.includes('tundra') || modelLower.includes('truck')) {
            return '/truck.png';
        }
        if (modelLower.includes('suv') || modelLower.includes('explorer') || modelLower.includes('tahoe') || modelLower.includes('rav4') || modelLower.includes('cr-v') || modelLower.includes('jeep')) {
            return '/suv.png';
        }
        // Default to sedan for now
        return '/sedan.png';
    };

    const carImage = getCarImage();

    return (
        <>
            <SEOHead
                title="AI Auto Repair | Intelligent Vehicle Configurator"
                description="Configure your vehicle diagnostics. AI-powered repair guides and real-time analysis in a modern virtual showroom."
                keywords="auto repair, car diagnostics, showroom, virtual garage, AI mechanic"
                canonicalUrl="https://ai-auto-repair-mobile.vercel.app/"
            />

            <div className="flex min-h-screen w-full relative overflow-hidden bg-deep-space">
                 {/* Background Elements */}
                <div className="absolute inset-0 bg-cyber-grid bg-grid-sm opacity-20 animate-pulse-slow"></div>
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-radial from-neon-purple/20 to-transparent blur-3xl rounded-full opacity-30"></div>
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-radial from-neon-cyan/20 to-transparent blur-3xl rounded-full opacity-30"></div>


                {/* Main Configurator Area */}
                <main className="flex-1 flex flex-col relative z-10 p-4 md:p-8 overflow-y-auto">

                    {/* Header Overlay */}
                    <div className="flex justify-between items-start mb-8 animate-slide-up">
                        <div>
                            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight text-glow">
                                SYSTEM <span className="text-brand-cyan">ONLINE</span>
                            </h2>
                            <p className="text-gray-400 font-mono mt-2 tracking-wide uppercase text-xs md:text-sm">
                                // Initiate Diagnostic Sequence
                            </p>
                        </div>
                        <div className="hidden md:block bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-brand-cyan/30 shadow-glow-cyan">
                            <span className="text-brand-cyan font-bold font-mono tracking-wider text-sm flex items-center gap-2">
                                <span className="w-2 h-2 bg-brand-cyan rounded-full animate-pulse"></span>
                                AI CORE v2.4 CONNECTED
                            </span>
                        </div>
                    </div>

                    {/* Central Glass Card */}
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-full max-w-7xl bg-glass-dark backdrop-blur-2xl border border-white/10 rounded-[2rem] md:rounded-[3rem] shadow-glass-premium p-6 md:p-12 animate-float relative overflow-hidden group">
                            
                            {/* Decorative refraction lines */}
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-cyan/50 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neon-purple/50 to-transparent"></div>

                            <div className="grid lg:grid-cols-2 gap-12 items-center">
                                {/* Left: UI Controls */}
                                <div className="space-y-8 relative z-20">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-2 font-sans tracking-wide">Configuration Panel</h3>
                                        <p className="text-gray-400 text-sm leading-relaxed font-mono">
                                            Select vehicle parameters to calibrate the deep-scan neural network. Accessing global service database...
                                        </p>
                                    </div>

                                    {/* The Dashboard Component */}
                                    <HolographicDashboard onVehicleChange={setSelectedVehicle} />
                                </div>

                                {/* Right: Dynamic Car Visualization */}
                                <div className="hidden lg:flex items-center justify-center relative h-[400px] w-full perspective-1000">
                                    {/* Holographic Base */}
                                    <div className="absolute bottom-10 w-[80%] h-20 bg-brand-cyan/10 blur-xl rounded-[100%] animate-pulse"></div>
                                    <div className="absolute bottom-12 w-[60%] h-[1px] bg-brand-cyan shadow-glow-cyan"></div>
                                    
                                    {/* Scanning Grid */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-brand-cyan/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                                    {carImage ? (
                                        <div className="relative w-full h-full flex items-center justify-center animate-fade-in">
                                            <div className="relative z-10 w-full flex justify-center">
                                                <img
                                                    src={carImage}
                                                    alt="Vehicle Preview"
                                                    className="w-auto max-h-[300px] object-contain drop-shadow-2xl transition-all duration-700 transform hover:scale-105 filter brightness-110 contrast-110"
                                                />
                                                {/* Scanline Effect Overlay on Car */}
                                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-cyan/10 to-transparent h-4 w-full animate-scanline pointer-events-none"></div>
                                            </div>
                                            
                                            <div className="absolute top-0 right-0 flex flex-col items-end gap-1">
                                                <div className="bg-black/60 backdrop-blur px-3 py-1 rounded-none border-r-2 border-brand-cyan">
                                                     <span className="text-[10px] font-bold text-brand-cyan uppercase tracking-widest font-mono">Holo-Render Active</span>
                                                </div>
                                                <div className="text-[10px] text-gray-500 font-mono">
                                                    {selectedVehicle ? `${selectedVehicle.year} // ${selectedVehicle.make} // ${selectedVehicle.model}` : 'Waiting for Data...'}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center space-y-4 opacity-40">
                                            <div className="w-64 h-32 border border-dashed border-gray-600 rounded-lg mx-auto flex flex-col items-center justify-center bg-black/30">
                                                <span className="text-xs font-mono text-gray-500 animate-pulse">AWAITING INPUT</span>
                                            </div>
                                            <p className="text-xs text-gray-600 font-mono tracking-widest">NO SIGNAL DETECTED</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Stats */}
                    <div className="mt-8 grid grid-cols-3 gap-8 max-w-4xl mx-auto opacity-70">
                        {['450k+ Models', 'Real-time TSBs', 'Factory Manuals'].map((stat, i) => (
                            <div key={i} className="text-center group cursor-default">
                                <p className="text-gray-300 font-bold text-sm md:text-lg font-mono group-hover:text-brand-cyan transition-colors">{stat}</p>
                                <div className="h-[2px] w-8 bg-gray-700 mx-auto mt-2 group-hover:bg-brand-cyan group-hover:w-16 transition-all duration-500"></div>
                            </div>
                        ))}
                    </div>

                </main>
            </div>
        </>
    );
};

export default HomePage;
