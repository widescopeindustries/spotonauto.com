import React from 'react';
import { VehicleInfo, Vehicle, User, SubscriptionTier } from '../types';
import { AlertIcon, WrenchIcon, ChatBubbleIcon, ClockIcon, DollarIcon, ListIcon, GlobeIcon } from './Icons';

interface VehicleInfoDisplayProps {
  vehicleInfo: VehicleInfo;
  vehicle: Vehicle;
  task: string;
  user: User | null;
  onGenerateGuide: () => void;
  onStartDiagnostic: () => void;
  onBack: () => void;
}

const VehicleInfoDisplay: React.FC<VehicleInfoDisplayProps> = ({ 
    vehicleInfo, vehicle, task, user, onGenerateGuide, onStartDiagnostic, onBack 
}) => {
  const { jobSnapshot, tsbs, recalls, sources } = vehicleInfo;
  const isPremiumUser = user?.tier === SubscriptionTier.Premium;

  const InfoCard: React.FC<{ icon: React.ReactNode, title: string, value: string }> = ({ icon, title, value }) => (
    <div className="bg-gray-900 p-4 rounded-lg border border-brand-cyan/20 flex items-center gap-4">
        <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-brand-cyan/10 text-brand-cyan rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-400 font-semibold uppercase tracking-wider">{title}</p>
            <p className="text-lg font-bold text-white">{value}</p>
        </div>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto bg-black/50 backdrop-blur-sm border border-brand-cyan/30 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
        <header className="p-6 border-b border-brand-cyan/30">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-white uppercase tracking-wider">{task}</h1>
                    <p className="text-lg text-brand-cyan font-semibold">{`${vehicle.year} ${vehicle.make} ${vehicle.model}`}</p>
                </div>
                <button onClick={onBack} className="text-sm font-semibold text-brand-cyan hover:underline">New Search</button>
            </div>
        </header>
        
        <main className="p-6 md:p-8 space-y-8">
            {/* Job Snapshot */}
            <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                    <ListIcon className="text-brand-cyan"/>Job Snapshot
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <InfoCard icon={<WrenchIcon className="w-6 h-6"/>} title="Difficulty" value={jobSnapshot.difficulty} />
                    <InfoCard icon={<ClockIcon className="w-6 h-6"/>} title="Est. Time" value={jobSnapshot.estimatedTime} />
                    <InfoCard icon={<WrenchIcon className="w-6 h-6"/>} title="Est. Parts Cost" value={jobSnapshot.estimatedPartsCost} />
                    <InfoCard icon={<DollarIcon className="w-6 h-6"/>} title="Potential Savings" value={jobSnapshot.potentialSavings} />
                </div>
            </section>

            {/* TSBs and Recalls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <section>
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                        <AlertIcon className="text-brand-cyan"/>Bulletins (TSBs)
                    </h2>
                    {tsbs.length > 0 ? (
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                           {tsbs.map((tsb) => (
                               <div key={tsb.bulletinNumber} className="bg-gray-900 p-4 rounded-lg border border-brand-cyan/20">
                                   <h3 className="font-bold text-brand-cyan-light">{tsb.title}</h3>
                                   <p className="text-sm text-gray-300 mt-1">{tsb.summary}</p>
                                   <p className="text-xs text-gray-500 mt-2">Bulletin: {tsb.bulletinNumber}</p>
                               </div>
                           ))}
                        </div>
                    ) : (
                        <p className="text-gray-400">No relevant technical service bulletins found.</p>
                    )}
                </section>
                <section>
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                        <AlertIcon className="text-red-500"/>Safety Recalls
                    </h2>
                     {recalls.length > 0 ? (
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                           {recalls.map((recall) => (
                               <div key={recall.campaignNumber} className="bg-red-900/20 p-4 rounded-lg border border-red-500/30">
                                   <h3 className="font-bold text-red-300">{recall.title}</h3>
                                   <p className="text-sm text-red-200 mt-1">{recall.consequence}</p>
                                   <p className="text-xs text-red-400 mt-2">Campaign: {recall.campaignNumber}</p>
                               </div>
                           ))}
                        </div>
                    ) : (
                        <p className="text-gray-400">No relevant safety recalls found.</p>
                    )}
                </section>
            </div>
            
            {sources && sources.length > 0 && (
                <section>
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-widest">
                        <GlobeIcon className="text-brand-cyan"/> Knowledge Sources
                    </h2>
                    <div className="bg-gray-900 p-4 rounded-lg border border-brand-cyan/20">
                        <p className="text-sm text-gray-400 mb-3">
                            The AI analysis was grounded using information from the following web sources:
                        </p>
                        <ul className="space-y-2">
                            {sources.map((source, index) => (
                                <li key={index}>
                                    <a
                                        href={source.uri}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-brand-cyan-light hover:text-brand-cyan hover:underline"
                                    >
                                        <span className="truncate">{source.title}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            )}
        </main>
        
        <footer className="p-6 border-t border-brand-cyan/30 bg-black/50">
            <h3 className="text-lg font-bold text-center text-white mb-4">Ready to Proceed?</h3>
            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={onGenerateGuide}
                    className="w-full flex items-center justify-center bg-transparent border-2 border-brand-cyan text-brand-cyan font-bold py-3 px-4 rounded-lg hover:bg-brand-cyan hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-brand-cyan transition-all duration-300"
                >
                    <WrenchIcon className="w-5 h-5 mr-2" />
                    Generate Step-by-Step Guide
                </button>
                <button
                    onClick={onStartDiagnostic}
                    disabled={!isPremiumUser}
                    className="w-full relative flex items-center justify-center bg-transparent border-2 border-brand-cyan/50 text-brand-cyan/50 font-bold py-3 px-4 rounded-lg hover:border-brand-cyan hover:text-brand-cyan focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-brand-cyan transition-all duration-300 disabled:border-gray-700 disabled:text-gray-400 disabled:hover:text-gray-700 disabled:cursor-not-allowed"
                >
                    {!isPremiumUser && (
                        <span className="absolute -top-2 -right-2 bg-brand-cyan text-black text-xs font-bold px-2 py-0.5 rounded-full uppercase">Premium</span>
                    )}
                    <ChatBubbleIcon className="w-5 h-5 mr-2" />
                    Start Live Diagnostic
                </button>
            </div>
        </footer>
    </div>
  );
};

export default VehicleInfoDisplay;