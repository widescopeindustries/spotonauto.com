import React from 'react';
import HolographicDashboard from '../components/HolographicDashboard';
import SEOHead from '../components/seo/SEOHead';

const HomePage: React.FC = () => {
    const [selectedVehicle, setSelectedVehicle] = React.useState<{ year: string; make: string; model: string } | null>(null);

    // Determine which image to show based on heuristics
    const getCarImage = () => {
        if (!selectedVehicle || !selectedVehicle.model) return null;
        const modelLower = selectedVehicle.model.toLowerCase();
        const makeLower = selectedVehicle.make.toLowerCase();

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

            <div
                className="flex h-screen w-full relative overflow-hidden bg-cover bg-center bg-no-repeat transition-all duration-1000"
                style={{ backgroundImage: `url('/showroom_bg.png')` }}
            >
                {/* Floating Sidebar Navigation */}
                <aside className="hidden md:flex flex-col items-center justify-center gap-8 w-24 h-full z-20 bg-white/10 backdrop-blur-md border-r border-white/20">
                    <div className="p-3 rounded-full bg-white shadow-lg cursor-pointer hover:scale-110 transition-transform">
                        <div className="w-6 h-6 bg-blue-600 rounded-full"></div>
                    </div>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-10 h-10 rounded-full border border-white/40 bg-white/20 hover:bg-white/60 cursor-pointer transition-all flex items-center justify-center backdrop-blur-sm">
                            <span className="w-1.5 h-1.5 bg-gray-600 rounded-full opacity-50"></span>
                        </div>
                    ))}
                </aside>

                {/* Main Configurator Area */}
                <main className="flex-1 flex flex-col relative z-10 p-6 md:p-12 overflow-y-auto">

                    {/* Header Overlay */}
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h2 className="text-4xl font-light text-slate-800 tracking-tight">Vehicle <span className="font-bold text-blue-600">Diagnostics</span></h2>
                            <p className="text-slate-500 font-medium mt-2 tracking-wide uppercase text-sm">Select Model // Configure Analysis</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-md px-6 py-2 rounded-full shadow-sm border border-white/50">
                            <span className="text-slate-800 font-bold font-mono tracking-wider">AI CORE v2.4 ONLINE</span>
                        </div>
                    </div>

                    {/* Central Glass Card */}
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-full max-w-6xl bg-white/60 backdrop-blur-2xl border border-white/60 rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-8 md:p-12 animate-float relative overflow-hidden">
                            {/* Decorative refraction lines */}
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0"></div>

                            <div className="grid md:grid-cols-2 gap-16 items-center">
                                {/* Left: UI Controls */}
                                <div className="space-y-8 relative z-20">
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Configure Session</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed">
                                            Select your vehicle parameters to initiate the deep-scan diagnostic protocol. Access factory service data instantly.
                                        </p>
                                    </div>

                                    {/* The Dashboard Component - We will style this via its own file next */}
                                    <HolographicDashboard onVehicleChange={setSelectedVehicle} />
                                </div>

                                {/* Right: Dynamic Car Visualization */}
                                <div className="hidden md:flex items-center justify-center relative h-[400px] w-full">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-100/30 to-white/0 rounded-3xl -z-10"></div>

                                    {carImage ? (
                                        <div className="relative w-full h-full flex items-center justify-center animate-fade-in-up">
                                            {/* Shadow underneath */}
                                            <div className="absolute bottom-10 w-[80%] h-4 bg-black/20 blur-xl rounded-[100%]"></div>
                                            <img
                                                src={carImage}
                                                alt="Vehicle Preview"
                                                className="relative z-10 w-full h-auto object-contain max-h-[350px] drop-shadow-2xl transition-all duration-700 transform hover:scale-105"
                                            />
                                            <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1 rounded text-xs font-bold text-slate-500 uppercase tracking-widest border border-white">
                                                Preview Render
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center space-y-4 opacity-40">
                                            <div className="w-64 h-20 border-2 border-dashed border-slate-300 rounded-lg mx-auto flex items-center justify-center">
                                                <span className="text-xs font-mono text-slate-400">NO SIGNAL</span>
                                            </div>
                                            <p className="text-xs text-slate-400 font-mono tracking-widest">AWAITING VEHICLE SELECTION...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Stats */}
                    <div className="mt-8 grid grid-cols-3 gap-8 max-w-4xl mx-auto">
                        {['450k+ Models', 'Real-time TSBs', 'Factory Manuals'].map((stat, i) => (
                            <div key={i} className="text-center">
                                <p className="text-slate-900 font-bold text-lg">{stat}</p>
                                <div className="h-1 w-8 bg-blue-500/30 mx-auto mt-2 rounded-full"></div>
                            </div>
                        ))}
                    </div>

                </main>
            </div>
        </>
    );
};

export default HomePage;
