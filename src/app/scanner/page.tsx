'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, Crown } from 'lucide-react';
import OBDScanner from '@/components/OBDScanner';
import { DTCInfo } from '@/services/obdService';

export default function ScannerPage() {
  const router = useRouter();
  const [dtcs, setDtcs] = useState<DTCInfo[]>([]);
  const [vin, setVin] = useState<string | null>(null);

  const handleDTCsRead = (codes: DTCInfo[]) => {
    setDtcs(codes);
  };

  const handleVINRead = (vinNumber: string) => {
    setVin(vinNumber);
  };

  const handleDiagnoseWithCodes = () => {
    // Build query with DTCs for AI diagnosis
    const codesString = dtcs.map(d => d.code).join(', ');
    const params = new URLSearchParams({
      task: `Diagnose codes: ${codesString}`,
      ...(vin && { vin }),
    });
    router.push(`/diagnose?${params.toString()}`);
  };

  return (
    <div className="min-h-screen pt-24 px-4 pb-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 mb-4">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-sm font-display uppercase tracking-wider">Pro Feature</span>
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-4">
            Live OBD-II <span className="text-cyan-400">Scanner</span>
          </h1>
          <p className="text-gray-400 font-body max-w-xl mx-auto">
            Connect your ELM327 Bluetooth scanner to read actual diagnostic codes from your vehicle.
            No more guessing - get real data for accurate diagnosis.
          </p>
        </motion.div>

        {/* Scanner Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <OBDScanner
            onDTCsRead={handleDTCsRead}
            onVINRead={handleVINRead}
          />
        </motion.div>

        {/* VIN Display */}
        {vin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 glass rounded-xl p-4 border border-cyan-500/20"
          >
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Vehicle VIN</p>
            <p className="font-mono text-cyan-400 text-lg">{vin}</p>
          </motion.div>
        )}

        {/* Diagnose Button */}
        {dtcs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
          >
            <p className="text-gray-400 mb-4 font-body">
              Found <span className="text-cyan-400 font-bold">{dtcs.length}</span> trouble code{dtcs.length > 1 ? 's' : ''}.
              Get AI-powered diagnosis and repair guides.
            </p>
            <button
              onClick={handleDiagnoseWithCodes}
              className="btn-cyber-primary text-lg px-8 py-4 flex items-center gap-3 mx-auto glow-button"
            >
              <Zap className="w-5 h-5" />
              Diagnose These Codes
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 glass rounded-xl p-6 border border-cyan-500/10"
        >
          <h3 className="font-display font-bold text-white mb-4">How to Connect</h3>
          <ol className="space-y-3 font-body text-gray-400">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-sm flex items-center justify-center">1</span>
              <span>Plug your ELM327 adapter into your vehicle's OBD-II port (usually under the dashboard)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-sm flex items-center justify-center">2</span>
              <span>Turn your ignition to ON (engine can be off)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-sm flex items-center justify-center">3</span>
              <span>Pair the ELM327 via Windows Bluetooth settings (look for "OBD-II" or similar)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-sm flex items-center justify-center">4</span>
              <span>Click "Connect Scanner" above and select the COM port</span>
            </li>
          </ol>
        </motion.div>
      </div>
    </div>
  );
}
