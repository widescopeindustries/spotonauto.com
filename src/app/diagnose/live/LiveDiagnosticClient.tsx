'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  connectOBD2,
  disconnectOBD2,
  readDTCs,
  readAllPIDs,
  readFreezeFrame,
  type OBD2Connection,
  type OBD2PIDResult,
  type OBD2DTC,
  type FreezeFrameData,
} from './obd2';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export default function LiveDiagnosticClient() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [deviceName, setDeviceName] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [dtcs, setDtcs] = useState<OBD2DTC[]>([]);
  const [pids, setPids] = useState<OBD2PIDResult[]>([]);
  const [freezeFrame, setFreezeFrame] = useState<FreezeFrameData | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState('');

  const connRef = useRef<OBD2Connection | null>(null);
  const monitorRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev.slice(-50), `${new Date().toLocaleTimeString()} ${msg}`]);
  }, []);

  // ─── Connect ────────────────────────────────────────────────────────────

  const handleConnect = async () => {
    if (!navigator.bluetooth) {
      setError('Web Bluetooth not supported. Use Chrome on Android or Chrome desktop with BLE adapter.');
      return;
    }

    setStatus('connecting');
    setError('');
    setLogs([]);

    try {
      const conn = await connectOBD2(addLog);
      connRef.current = conn;
      setDeviceName(conn.device.name || 'OBD2 Scanner');
      setStatus('connected');
      addLog('✓ Ready — reading vehicle data...');

      // Auto-read DTCs and PIDs on connect
      await readVehicleData(conn);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setError(msg);
      setStatus('error');
      addLog(`✗ ${msg}`);
    }
  };

  const handleDisconnect = () => {
    if (monitorRef.current) {
      clearInterval(monitorRef.current);
      monitorRef.current = null;
    }
    if (connRef.current) {
      disconnectOBD2(connRef.current);
      connRef.current = null;
    }
    setStatus('disconnected');
    setIsMonitoring(false);
    addLog('Disconnected');
  };

  // ─── Read Data ──────────────────────────────────────────────────────────

  const readVehicleData = async (conn: OBD2Connection) => {
    addLog('Reading DTCs...');
    const codes = await readDTCs(conn);
    setDtcs(codes);
    addLog(`Found ${codes.length} DTC${codes.length !== 1 ? 's' : ''}`);

    if (codes.length > 0) {
      addLog('Reading freeze frame...');
      const ff = await readFreezeFrame(conn);
      setFreezeFrame(ff);
    }

    addLog('Reading live data...');
    const pidData = await readAllPIDs(conn);
    setPids(pidData);
    addLog(`Read ${pidData.length} parameters`);
  };

  // ─── Live Monitoring ────────────────────────────────────────────────────

  const toggleMonitoring = () => {
    if (!connRef.current) return;

    if (isMonitoring) {
      if (monitorRef.current) clearInterval(monitorRef.current);
      monitorRef.current = null;
      setIsMonitoring(false);
      addLog('Monitoring stopped');
    } else {
      setIsMonitoring(true);
      addLog('Live monitoring started (2s interval)');
      monitorRef.current = setInterval(async () => {
        if (!connRef.current) return;
        try {
          const pidData = await readAllPIDs(connRef.current);
          setPids(pidData);
        } catch {
          addLog('⚠ Read error — retrying...');
        }
      }, 2000);
    }
  };

  const handleRefreshDTCs = async () => {
    if (!connRef.current) return;
    addLog('Refreshing DTCs...');
    const codes = await readDTCs(connRef.current);
    setDtcs(codes);
    addLog(`Found ${codes.length} DTC${codes.length !== 1 ? 's' : ''}`);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (monitorRef.current) clearInterval(monitorRef.current);
      if (connRef.current) disconnectOBD2(connRef.current);
    };
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-cyan-400 transition">Home</Link>
          <span>/</span>
          <span className="text-cyan-400">Live Diagnostics</span>
        </nav>

        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">Live Vehicle Diagnostics</h1>
          <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
            Prototype
          </span>
        </div>
        <p className="text-gray-400 text-sm mb-8">
          Connect your OBD2 scanner via Bluetooth to read codes, live data, and freeze frame.
        </p>

        {/* Connection */}
        <section className="mb-6">
          {status === 'disconnected' || status === 'error' ? (
            <button
              onClick={handleConnect}
              className="w-full py-4 rounded-xl bg-cyan-500 text-black font-bold text-lg hover:bg-cyan-400 transition active:scale-[0.98]"
            >
              Connect OBD2 Scanner
            </button>
          ) : status === 'connecting' ? (
            <div className="w-full py-4 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-center">
              <div className="animate-pulse text-cyan-300 font-bold">Connecting...</div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-300 font-bold text-sm">{deviceName}</span>
                </div>
                <p className="text-gray-400 text-xs mt-0.5">Connected</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={toggleMonitoring}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                    isMonitoring
                      ? 'bg-amber-500 text-black hover:bg-amber-400'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30'
                  }`}
                >
                  {isMonitoring ? '■ Stop' : '● Live'}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 text-sm font-bold hover:bg-red-500/30 transition"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              {error}
            </div>
          )}
        </section>

        {/* DTCs */}
        {status === 'connected' && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Trouble Codes</h2>
              <button
                onClick={handleRefreshDTCs}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition"
              >
                Refresh
              </button>
            </div>

            {dtcs.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                <p className="text-emerald-300 font-bold">No trouble codes</p>
                <p className="text-gray-500 text-xs mt-1">Your vehicle is code-free</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dtcs.map((dtc, i) => (
                  <div
                    key={`${dtc.code}-${i}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/20"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-lg font-bold text-amber-400">{dtc.code}</span>
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                        dtc.status === 'stored'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {dtc.status}
                      </span>
                    </div>
                    <Link
                      href={`/codes/${dtc.code.toLowerCase()}`}
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition"
                    >
                      View Details →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Freeze Frame */}
        {freezeFrame && (
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-3">Freeze Frame Data</h2>
            <div className="grid grid-cols-2 gap-2">
              {freezeFrame.rpm != null && (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">RPM at fault</p>
                  <p className="text-lg font-bold text-white">{freezeFrame.rpm} <span className="text-xs text-gray-400">rpm</span></p>
                </div>
              )}
              {freezeFrame.coolantTemp != null && (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">Coolant at fault</p>
                  <p className="text-lg font-bold text-white">{freezeFrame.coolantTemp} <span className="text-xs text-gray-400">°F</span></p>
                </div>
              )}
              {freezeFrame.speed != null && (
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">Speed at fault</p>
                  <p className="text-lg font-bold text-white">{freezeFrame.speed} <span className="text-xs text-gray-400">mph</span></p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Live PIDs */}
        {pids.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-bold">Live Data</h2>
              {isMonitoring && (
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Streaming
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {pids.map((pid) => (
                <div
                  key={pid.pid}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/10"
                >
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">{pid.name}</p>
                  <p className="text-xl font-bold text-white tabular-nums">
                    {pid.value}
                    <span className="text-xs text-gray-400 ml-1">{pid.unit}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Console Log */}
        <section>
          <h2 className="text-sm font-bold text-gray-500 mb-2">Connection Log</h2>
          <div className="rounded-xl bg-black/40 border border-white/5 p-3 max-h-48 overflow-y-auto font-mono text-xs text-gray-400 space-y-0.5">
            {logs.length === 0 ? (
              <p className="text-gray-600">Connect a scanner to begin...</p>
            ) : (
              logs.map((log, i) => <p key={i}>{log}</p>)
            )}
          </div>
        </section>

        {/* Info */}
        <div className="mt-8 p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-gray-500">
          <p className="font-bold text-gray-400 mb-1">Requirements</p>
          <ul className="space-y-0.5">
            <li>• Chrome browser (Android or desktop with BLE adapter)</li>
            <li>• Bluetooth Low Energy (BLE) OBD2 scanner (ELM327 BLE, Topdon, Vgate)</li>
            <li>• Vehicle ignition ON or engine running</li>
            <li>• Classic Bluetooth ELM327 adapters are NOT supported — must be BLE</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
