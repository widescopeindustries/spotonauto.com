import React, { useState, useCallback, useEffect } from 'react';
import type { Vehicle, RepairGuide, VehicleInfo, HistoryItem } from './types';
import { generateFullRepairGuide, getVehicleInfo } from './services/geminiService';
import { getHistory, saveGuide, getGuideById } from './services/storageService';
import { useAuth } from './contexts/AuthContext';
import { SubscriptionTier } from './types';

import VehicleForm from './components/VehicleForm';
import LoadingIndicator from './components/LoadingIndicator';
import RepairGuideDisplay from './components/RepairGuideDisplay';
import DiagnosticAssistant from './components/DiagnosticAssistant';
import AuthForm from './components/AuthForm';
import Header from './components/Header';
import UpgradeModal from './components/UpgradeModal';
import VehicleInfoDisplay from './components/VehicleInfoDisplay';
import HistoryDisplay from './components/HistoryDisplay';
import { AlertIcon } from './components/Icons';

type AppMode = 'form' | 'loading' | 'guide' | 'diagnostic' | 'error' | 'auth' | 'vehicleInfo' | 'history';

const App: React.FC = () => {
  const [vehicle, setVehicle] = useState<Vehicle>({ year: '', make: '', model: '' });
  const [task, setTask] = useState<string>('');
  const [guide, setGuide] = useState<RepairGuide | null>(null);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [mode, setMode] = useState<AppMode>('form');
  const [error, setError] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const { user } = useAuth();
  const isPremium = user?.tier === SubscriptionTier.Premium;
  const FREE_TIER_LIMIT = 1;

  useEffect(() => {
    if (user) {
      setHistory(getHistory());
    } else {
      setHistory([]);
    }
  }, [user]);

  const handleReset = () => {
    setVehicle({ year: '', make: '', model: '' });
    setTask('');
    setGuide(null);
    setVehicleInfo(null);
    setError(null);
    setMode('form');
  };

  const handleAuthSuccess = () => {
    setMode('form');
  };

  const handleAnalyzeTask = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setMode('loading');
    setError(null);
    try {
      const info = await getVehicleInfo(vehicle, task);
      setVehicleInfo(info);
      setMode('vehicleInfo');
    } catch (err) {
       if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred. Please try again.");
      }
      setMode('error');
    }
  }, [vehicle, task]);

  const handleGenerateGuide = useCallback(async () => {
    if (!isPremium && usageCount >= FREE_TIER_LIMIT) {
      setIsUpgradeModalOpen(true);
      return;
    }

    setMode('loading');
    setError(null);
    setGuide(null);

    try {
      const generatedGuide = await generateFullRepairGuide(vehicle, task);
      setGuide(generatedGuide);
      setMode('guide');

      if (isPremium) {
        const newHistoryItem = saveGuide(generatedGuide);
        setHistory(prev => [newHistoryItem, ...prev.filter(h => h.id !== newHistoryItem.id)]);
      } else {
        setUsageCount(prev => prev + 1);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred. Please try again.");
      }
      setMode('error');
    }
  }, [vehicle, task, isPremium, usageCount]);
  
  const handleViewHistoryItem = (id: string) => {
    const savedGuide = getGuideById(id);
    if (savedGuide) {
      setGuide(savedGuide);
      setVehicle({
        year: savedGuide.vehicle.split(' ')[0],
        make: savedGuide.vehicle.split(' ')[1],
        model: savedGuide.vehicle.split(' ')[2],
      });
      setTask(savedGuide.title);
      setMode('guide');
    } else {
      setError("Could not find the saved guide. It may have been cleared.");
      setMode('error');
    }
  };

  const handleStartDiagnostic = () => {
    if (!isPremium) {
      setIsUpgradeModalOpen(true);
      return;
    }
    setMode('diagnostic');
  };

  const renderContent = () => {
    switch (mode) {
      case 'loading':
        return <LoadingIndicator />;
      case 'auth':
        return <AuthForm onAuthSuccess={handleAuthSuccess} />;
      case 'error':
        return (
          <div className="w-full max-w-2xl mx-auto text-center bg-black/50 backdrop-blur-sm border border-red-500/50 p-8 rounded-xl animate-fade-in">
            <AlertIcon className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-red-400">Operation Failed</h2>
            <p className="text-gray-300 mt-2 mb-6">{error}</p>
            <button
              onClick={handleReset}
              className="bg-transparent border-2 border-brand-cyan text-brand-cyan font-bold py-2 px-6 rounded-lg hover:bg-brand-cyan hover:text-black transition-colors"
            >
              Try Again
            </button>
          </div>
        );
      case 'vehicleInfo':
        return vehicleInfo ? (
          <VehicleInfoDisplay 
            vehicleInfo={vehicleInfo}
            vehicle={vehicle}
            task={task}
            user={user}
            onGenerateGuide={handleGenerateGuide}
            onStartDiagnostic={handleStartDiagnostic}
            onBack={handleReset}
          />
        ) : null;
      case 'guide':
        return guide ? <RepairGuideDisplay guide={guide} onReset={handleReset} /> : null;
      case 'diagnostic':
        return <DiagnosticAssistant vehicle={vehicle} initialProblem={task} onReset={handleReset} />;
      case 'history':
        return <HistoryDisplay history={history} onViewItem={handleViewHistoryItem} onBack={handleReset} />;
      case 'form':
      default:
        return (
          <VehicleForm
            vehicle={vehicle}
            setVehicle={setVehicle}
            task={task}
            setTask={setTask}
            onAnalyze={handleAnalyzeTask}
            user={user}
          />
        );
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-black">
      <Header onAuthClick={() => setMode('auth')} onHistoryClick={() => setMode('history')} />
      <main className="flex-grow w-full flex items-center justify-center p-4 md:p-8">
        {renderContent()}
      </main>
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onAuthClick={() => {
          setIsUpgradeModalOpen(false);
          setMode('auth');
        }}
      />
    </div>
  );
};

export default App;
