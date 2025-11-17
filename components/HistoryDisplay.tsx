import React from 'react';
import { HistoryItem } from '../types';
import { BookOpenIcon, WrenchIcon } from './Icons';

interface HistoryDisplayProps {
  history: HistoryItem[];
  onViewItem: (id: string) => void;
  onBack: () => void;
}

const HistoryDisplay: React.FC<HistoryDisplayProps> = ({ history, onViewItem, onBack }) => {

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-black/50 backdrop-blur-sm border border-brand-cyan/30 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
        <header className="p-6 border-b border-brand-cyan/30">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <BookOpenIcon className="w-8 h-8 text-brand-cyan"/>
                    <div>
                        <h1 className="text-2xl font-bold text-white uppercase tracking-wider">Repair History</h1>
                        <p className="text-md text-brand-cyan-light font-semibold">Your saved guides</p>
                    </div>
                </div>
                <button onClick={onBack} className="text-sm font-semibold text-brand-cyan hover:underline">New Search</button>
            </div>
        </header>
        
        <main className="p-6 md:p-8">
            {history.length > 0 ? (
                <ul className="space-y-4">
                    {history.map(item => (
                        <li key={item.id}>
                            <button
                                onClick={() => onViewItem(item.id)}
                                className="w-full text-left p-4 bg-gray-900 rounded-lg border border-brand-cyan/20 hover:bg-brand-cyan/10 hover:border-brand-cyan/50 transition-all duration-200"
                            >
                                <p className="font-bold text-lg text-brand-cyan-light">{item.title}</p>
                                <p className="font-semibold text-white">{item.vehicle}</p>
                                <p className="text-xs text-gray-400 mt-2">{formatDate(item.timestamp)}</p>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-12">
                    <WrenchIcon className="w-16 h-16 mx-auto text-gray-700" />
                    <h2 className="mt-4 text-xl font-bold text-white">No History Yet</h2>
                    <p className="mt-1 text-gray-400">Generate a repair guide and it will be saved here automatically.</p>
                </div>
            )}
        </main>
    </div>
  );
};

export default HistoryDisplay;
