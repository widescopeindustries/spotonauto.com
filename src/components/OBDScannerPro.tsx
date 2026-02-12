'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bluetooth, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  RefreshCw,
  Car,
  Cpu,
  Zap
} from 'lucide-react';
import { garageService } from '@/services/garageService';
import { SubscriptionService } from '@/services/subscriptionService';
import { sendDiagnosticMessageWithHistory } from '@/services/geminiService';

interface OBDScannerProProps {
  userId: string;
  vehicle?: {
    year: string;
    make: string;
    model: string;
  };
}

interface OBDCode {
  code: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  system: string;
}

interface ScanResult {
  codes: OBDCode[];
  readiness: {
    monitors: string[];
    status: 'complete' | 'incomplete';
  };
  freezeFrame?: {
    rpm: number;
    speed: number;
    temp: number;
  };
}

export default function OBDScannerPro({ userId, vehicle }: OBDScannerProProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasPro, setHasPro] = useState(false);

  const subscriptionService = new SubscriptionService(userId);

  useEffect(() => {
    checkSubscription();
  }, []);

  async function checkSubscription() {
    const canUse = await subscriptionService.canUseOBD();
    setHasPro(canUse);
  }

  async function connectScanner() {
    if (!hasPro) {
      setError('OBD-II scanning requires a Pro subscription');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      // Check if Web Bluetooth is supported
      if (!(navigator as any).bluetooth) {
        throw new Error('Web Bluetooth is not supported in this browser. Try Chrome on Android or desktop.');
      }

      // Request Bluetooth device
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { namePrefix: 'OBD' },
          { namePrefix: 'Veepeak' },
          { namePrefix: 'BlueDriver' },
          { namePrefix: 'FIXD' }
        ],
        optionalServices: ['0000fff0-0000-1000-8000-00805f9b34fb'] // Common OBD service UUID
      });

      // Connect to GATT server
      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error('Failed to connect to OBD scanner');
      }

      // Get service and characteristics
      const service = await server.getPrimaryService('0000fff0-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('0000fff1-0000-1000-8000-00805f9b34fb');

      // Initialize OBD adapter
      await initializeOBD(characteristic);
      
      setIsConnected(true);
      
      // Listen for disconnect
      device.addEventListener('gattserverdisconnected', () => {
        setIsConnected(false);
        setError('Scanner disconnected');
      });

    } catch (err: any) {
      setError(err.message || 'Failed to connect to scanner');
    } finally {
      setIsConnecting(false);
    }
  }

  async function initializeOBD(characteristic: any) {
    // Send initialization commands
    const initCommands = ['ATZ', 'ATE0', 'ATL1', 'ATH1', 'ATS0'];
    for (const cmd of initCommands) {
      await sendCommand(characteristic, cmd);
      await new Promise(r => setTimeout(r, 100));
    }
  }

  async function sendCommand(characteristic: any, command: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(command + '\r');
    await characteristic.writeValue(data);
    
    // Read response
    const value = await characteristic.readValue();
    const decoder = new TextDecoder();
    return decoder.decode(value);
  }

  async function runScan() {
    if (!isConnected) {
      setError('Please connect your OBD scanner first');
      return;
    }

    setScanning(true);
    setScanResult(null);
    setAiAnalysis('');

    try {
      // Simulate scan for MVP (replace with actual OBD commands)
      await new Promise(r => setTimeout(r, 3000));

      // Mock scan result - replace with actual OBD-II commands
      const mockResult: ScanResult = {
        codes: [
          {
            code: 'P0301',
            description: 'Cylinder 1 Misfire Detected',
            severity: 'high',
            system: 'Engine'
          },
          {
            code: 'P0420',
            description: 'Catalyst System Efficiency Below Threshold',
            severity: 'medium',
            system: 'Emissions'
          }
        ],
        readiness: {
          monitors: ['Misfire', 'Fuel System', 'Comprehensive Component'],
          status: 'complete'
        },
        freezeFrame: {
          rpm: 1250,
          speed: 0,
          temp: 195
        }
      };

      setScanResult(mockResult);
      
      // Run AI analysis
      await analyzeWithAI(mockResult);

    } catch (err: any) {
      setError(err.message || 'Scan failed');
    } finally {
      setScanning(false);
    }
  }

  async function analyzeWithAI(result: ScanResult) {
    setAnalyzing(true);

    try {
      const vehicleInfo = vehicle 
        ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
        : 'Unknown vehicle';

      const codesText = result.codes.map(c => `${c.code}: ${c.description}`).join('\n');
      
      const prompt = `I have an OBD-II scan result for a ${vehicleInfo}:

Codes detected:
${codesText}

Freeze frame data:
- RPM: ${result.freezeFrame?.rpm}
- Speed: ${result.freezeFrame?.speed}
- Coolant Temp: ${result.freezeFrame?.temp}°F

Please analyze these codes and provide:
1. What each code means in simple terms
2. Most likely causes (ranked by probability)
3. Urgency level (can I keep driving?)
4. Estimated repair cost (DIY vs shop)
5. Step-by-step diagnostic procedure
6. Safety warnings if applicable`;

      // Use existing AI service
      const response = await fetch('/api/generate-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'diagnostic-chat',
          payload: {
            vehicle: vehicle || { year: '2020', make: 'Unknown', model: 'Unknown' },
            message: prompt,
            history: []
          }
        })
      });

      const data = await response.json();
      setAiAnalysis(data.text || data.instruction || 'Analysis complete');

      // Save to history
      await garageService.saveDiagnosis(userId, {
        vehicle_id: undefined,
        vehicle_year: vehicle?.year || 'Unknown',
        vehicle_make: vehicle?.make || 'Unknown',
        vehicle_model: vehicle?.model || 'Unknown',
        problem: `OBD Scan: ${result.codes.map(c => c.code).join(', ')}`,
        conversation: [
          { role: 'user', text: 'Ran OBD-II scan' },
          { role: 'model', text: data.text || data.instruction }
        ],
        diagnosis_summary: aiAnalysis,
        status: 'active'
      });

    } catch (err) {
      console.error('AI analysis failed:', err);
      setAiAnalysis('AI analysis unavailable. Please consult a mechanic with these codes.');
    } finally {
      setAnalyzing(false);
    }
  }

  if (!hasPro) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-neon-cyan/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bluetooth className="w-8 h-8 text-neon-cyan" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">OBD-II Scanner</h3>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          Connect any Bluetooth OBD-II scanner to read codes, get instant AI analysis, 
          and save diagnostics to your garage.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-neon-cyan text-black font-semibold rounded-xl hover:bg-cyan-400 transition-colors"
          >
            <Zap className="w-5 h-5" />
            Upgrade to Pro
          </a>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Compatible with BlueDriver, FIXD, Veepeak, and most ELM327 adapters
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <h3 className="text-lg font-bold text-white">OBD-II Scanner</h3>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <span className="text-sm text-green-400">Connected</span>
            ) : (
              <span className="text-sm text-gray-500">Disconnected</span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Connection Section */}
        {!isConnected && (
          <div className="text-center py-8">
            <Bluetooth className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-6">
              Connect your Bluetooth OBD-II scanner to read codes and get AI analysis
            </p>
            <button
              onClick={connectScanner}
              disabled={isConnecting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-neon-cyan text-black font-semibold rounded-xl hover:bg-cyan-400 transition-colors disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Bluetooth className="w-5 h-5" />
                  Connect Scanner
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-4">
              Make sure your scanner is powered on and in pairing mode
            </p>
          </div>
        )}

        {/* Scan Button */}
        {isConnected && !scanResult && (
          <div className="text-center py-8">
            <Activity className="w-16 h-16 text-neon-cyan mx-auto mb-4" />
            <p className="text-gray-400 mb-6">
              Scanner connected. Ready to read diagnostic trouble codes.
            </p>
            <button
              onClick={runScan}
              disabled={scanning}
              className="inline-flex items-center gap-2 px-8 py-4 bg-neon-cyan text-black font-bold rounded-xl hover:bg-cyan-400 transition-colors disabled:opacity-50"
            >
              {scanning ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Cpu className="w-5 h-5" />
                  Run Diagnostic Scan
                </>
              )}
            </button>
          </div>
        )}

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scan Results */}
        <AnimatePresence>
          {scanResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Codes Found */}
              <div className="bg-gray-900/50 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Codes Detected ({scanResult.codes.length})
                </h4>
                <div className="space-y-2">
                  {scanResult.codes.map((code, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        code.severity === 'critical' ? 'bg-red-500/10 border-red-500/20' :
                        code.severity === 'high' ? 'bg-orange-500/10 border-orange-500/20' :
                        'bg-yellow-500/10 border-yellow-500/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <code className="text-lg font-bold text-white">{code.code}</code>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          code.severity === 'critical' ? 'bg-red-500 text-white' :
                          code.severity === 'high' ? 'bg-orange-500 text-white' :
                          'bg-yellow-500 text-black'
                        }`}>
                          {code.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{code.description}</p>
                      <p className="text-xs text-gray-500 mt-1">System: {code.system}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Analysis */}
              {analyzing ? (
                <div className="bg-neon-cyan/5 border border-neon-cyan/20 rounded-xl p-6 text-center">
                  <RefreshCw className="w-8 h-8 text-neon-cyan animate-spin mx-auto mb-3" />
                  <p className="text-neon-cyan">AI analyzing your scan results...</p>
                </div>
              ) : aiAnalysis && (
                <div className="bg-gray-900/50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-neon-cyan mb-3 flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    AI Analysis
                  </h4>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <div className="text-gray-300 whitespace-pre-wrap">{aiAnalysis}</div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={runScan}
                  className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Scan Again
                </button>
                <a
                  href="/history"
                  className="flex-1 px-4 py-3 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan rounded-xl hover:bg-neon-cyan/20 transition-colors text-center"
                >
                  View in Garage
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
