
import React, { useState } from 'react';
import { WrenchIcon, CheckCircleIcon } from './Icons';
import { useAuth } from '../contexts/AuthContext';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthClick: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onAuthClick }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    if (!user) {
      // If not logged in, log in first
      onAuthClick();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          userId: user.id
        })
      });

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (e) {
      console.error("Upgrade failed", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-title"
    >
      <div
        className="bg-black border border-brand-cyan/50 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden shadow-glow-cyan"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-brand-cyan rounded-full flex items-center justify-center mb-6 shadow-glow-cyan">
            <WrenchIcon className="w-8 h-8 text-black" />
          </div>
          <h2 id="upgrade-title" className="text-3xl font-bold text-white uppercase tracking-wider">Upgrade to Premium</h2>
          <p className="text-gray-300 mt-2">
            You've used your free guide. Sign up for Premium to unlock unlimited access!
          </p>
        </div>

        <div className="px-8 pb-8">
          <ul className="space-y-3 text-left mb-8">
            <li className="flex items-center gap-3">
              <CheckCircleIcon className="text-brand-cyan w-6 h-6 flex-shrink-0" />
              <span className="text-gray-200">Unlimited Repair Guides</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircleIcon className="text-brand-cyan w-6 h-6 flex-shrink-0" />
              <span className="text-gray-200">Live Diagnostic Assistant</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircleIcon className="text-brand-cyan w-6 h-6 flex-shrink-0" />
              <span className="text-gray-200">Save Repair History</span>
            </li>
          </ul>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full bg-brand-cyan text-black font-bold py-3 px-4 rounded-lg hover:bg-brand-cyan-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-brand-cyan transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : (user ? 'Upgrade Now - $9.99/mo' : 'Sign In to Upgrade')}
            </button>
            <button
              onClick={onClose}
              className="w-full bg-transparent border-2 border-gray-600 text-gray-300 font-bold py-3 px-4 rounded-lg hover:bg-gray-800 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-gray-500 transition-all"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;