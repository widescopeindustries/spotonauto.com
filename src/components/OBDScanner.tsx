'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bluetooth, BluetoothConnected, AlertTriangle, Activity, Zap, X, RefreshCw, Trash2 } from 'lucide-react';
import { obdService, DTCInfo, OBDData } from '@/services/obdService';

interface OBDScannerProps {
  onDTCsRead?: (dtcs: DTCInfo[]) => void;
  onVINRead?: (vin: string) => void;
  compact?: boolean;
}

const OBDScanner: React.FC<OBDScannerProps> = ({ onDTCsRead, onVINRead, compact = false }) => {
  const [isSupported, setIsSupported] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [dtcs, setDtcs] = useState<DTCInfo[]>([]);
  const [liveData, setLiveData] = useState<Partial<OBDData>>({});
  const [error, setError] = useState<string | null>(null);
  const [showLiveData, setShowLiveData] = useState(false);

  useEffect(() => {
    setIsSupported(obdService.isSupported());
  }, []);

  const handleConnect = async () => {
    setError(null);
    setIsConnecting(true);

    try {
      await obdService.connect();
      setIsConnected(true);

      // Try to read VIN
      const vin = await obdService.readVIN();
      if (vin && onVINRead) {
        onVINRead(vin);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await obdService.disconnect();
    setIsConnected(false);
    setDtcs([]);
    setLiveData({});
    setShowLiveData(false);
  };

  const handleReadDTCs = async () => {
    setError(null);
    setIsScanning(true);

    try {
      const codes = await obdService.readDTCs();
      setDtcs(codes);
      if (onDTCsRead) {
        onDTCsRead(codes);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to read codes');
    } finally {
      setIsScanning(false);
    }
  };

  const handleReadLiveData = async () => {
    setShowLiveData(true);
    setError(null);

    try {
      const data = await obdService.readLiveData();
      setLiveData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to read live data');
    }
  };

  const handleClearDTCs = async () => {
    if (!confirm('This will clear all diagnostic codes. The check engine light will turn off. Continue?')) {
      return;
    }

    setError(null);
    try {
      const success = await obdService.clearDTCs();
      if (success) {
        setDtcs([]);
        if (onDTCsRead) onDTCsRead([]);
      } else {
        setError('Failed to clear codes');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isSupported) {
    return (
      <div className="glass rounded-xl p-4 border border-yellow-500/30">
        <div className="flex items-center gap-2 text-yellow-400">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-body text-sm">OBD Scanner requires Chrome or Edge browser</span>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="glass rounded-xl p-4 border border-cyan-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <BluetoothConnected className="w-5 h-5 text-green-400" />
            ) : (
              <Bluetooth className="w-5 h-5 text-gray-400" />
            )}
            <span className="font-body text-sm text-gray-300">
              {isConnected ? 'Scanner Connected' : 'OBD Scanner'}
            </span>
          </div>

          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="btn-cyber py-1.5 px-3 text-xs"
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleReadDTCs}
                disabled={isScanning}
                className="btn-cyber-primary py-1.5 px-3 text-xs"
              >
                {isScanning ? 'Scanning...' : 'Read Codes'}
              </button>
              <button
                onClick={handleDisconnect}
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {dtcs.length > 0 && (
          <div className="mt-3 pt-3 border-t border-cyan-500/10">
            <div className="flex flex-wrap gap-2">
              {dtcs.map((dtc, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-mono"
                >
                  {dtc.code}
                </span>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="mt-2 text-red-400 text-xs">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 border border-cyan-500/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isConnected ? 'bg-green-500/20' : 'bg-cyan-500/10'}`}>
            {isConnected ? (
              <BluetoothConnected className="w-5 h-5 text-green-400" />
            ) : (
              <Bluetooth className="w-5 h-5 text-cyan-400" />
            )}
          </div>
          <div>
            <h3 className="font-display font-bold text-white">OBD-II Scanner</h3>
            <p className="text-xs text-gray-400 font-body">
              {isConnected ? 'Connected to ELM327' : 'Connect your scanner to read live data'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-mono ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
            {isConnected ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Connection Section */}
      {!isConnected ? (
        <div className="text-center py-8">
          <Bluetooth className="w-16 h-16 text-cyan-400/30 mx-auto mb-4" />
          <p className="text-gray-400 font-body mb-4">
            Pair your ELM327 via Bluetooth first, then click connect.
          </p>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="btn-cyber-primary flex items-center gap-2 mx-auto"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Bluetooth className="w-4 h-4" />
                Connect Scanner
              </>
            )}
          </button>
        </div>
      ) : (
        <>
          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              onClick={handleReadDTCs}
              disabled={isScanning}
              className="btn-cyber-primary py-3 flex flex-col items-center gap-1"
            >
              <AlertTriangle className="w-5 h-5" />
              <span className="text-xs">{isScanning ? 'Scanning...' : 'Read DTCs'}</span>
            </button>
            <button
              onClick={handleReadLiveData}
              className="btn-cyber py-3 flex flex-col items-center gap-1"
            >
              <Activity className="w-5 h-5" />
              <span className="text-xs">Live Data</span>
            </button>
            <button
              onClick={handleClearDTCs}
              disabled={dtcs.length === 0}
              className="btn-cyber py-3 flex flex-col items-center gap-1 disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5" />
              <span className="text-xs">Clear Codes</span>
            </button>
          </div>

          {/* DTCs Display */}
          {dtcs.length > 0 && (
            <div className="mb-6">
              <h4 className="font-display text-sm text-cyan-400 mb-3 uppercase tracking-wider">
                Diagnostic Trouble Codes ({dtcs.length})
              </h4>
              <div className="space-y-2">
                {dtcs.map((dtc, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-red-950/30 border border-red-500/30 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono font-bold text-red-400">{dtc.code}</span>
                        <span className="ml-2 text-xs text-gray-500 uppercase">{dtc.system}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 mt-1 font-body">{dtc.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {dtcs.length === 0 && !isScanning && (
            <div className="text-center py-4 bg-green-950/20 border border-green-500/20 rounded-lg mb-6">
              <Zap className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-green-400 font-body">No trouble codes found!</p>
            </div>
          )}

          {/* Live Data Display */}
          <AnimatePresence>
            {showLiveData && Object.keys(liveData).length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <h4 className="font-display text-sm text-cyan-400 mb-3 uppercase tracking-wider">
                  Live Sensor Data
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {liveData.rpm !== undefined && (
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 uppercase">RPM</p>
                      <p className="text-xl font-mono text-cyan-400">{Math.round(liveData.rpm)}</p>
                    </div>
                  )}
                  {liveData.speed !== undefined && (
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 uppercase">Speed</p>
                      <p className="text-xl font-mono text-cyan-400">{liveData.speed} km/h</p>
                    </div>
                  )}
                  {liveData.coolantTemp !== undefined && (
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 uppercase">Coolant</p>
                      <p className="text-xl font-mono text-cyan-400">{liveData.coolantTemp}°C</p>
                    </div>
                  )}
                  {liveData.engineLoad !== undefined && (
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 uppercase">Load</p>
                      <p className="text-xl font-mono text-cyan-400">{liveData.engineLoad.toFixed(1)}%</p>
                    </div>
                  )}
                  {liveData.throttle !== undefined && (
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 uppercase">Throttle</p>
                      <p className="text-xl font-mono text-cyan-400">{liveData.throttle.toFixed(1)}%</p>
                    </div>
                  )}
                  {liveData.intakeTemp !== undefined && (
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 uppercase">Intake</p>
                      <p className="text-xl font-mono text-cyan-400">{liveData.intakeTemp}°C</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleReadLiveData}
                  className="mt-3 text-cyan-400 text-xs flex items-center gap-1 mx-auto hover:underline"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Disconnect */}
          <button
            onClick={handleDisconnect}
            className="w-full mt-4 py-2 text-gray-400 hover:text-red-400 text-sm transition-colors"
          >
            Disconnect Scanner
          </button>
        </>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-950/30 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default OBDScanner;
