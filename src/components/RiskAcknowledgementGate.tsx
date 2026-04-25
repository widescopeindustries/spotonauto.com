'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface RiskAcknowledgementGateProps {
  storageKey?: string;
}

const DEFAULT_STORAGE_KEY = 'spotonauto:risk_ack:v1';

export default function RiskAcknowledgementGate({ storageKey = DEFAULT_STORAGE_KEY }: RiskAcknowledgementGateProps) {
  const [needsAcknowledgement, setNeedsAcknowledgement] = useState(false);

  useEffect(() => {
    try {
      const acknowledged = window.localStorage.getItem(storageKey);
      setNeedsAcknowledgement(acknowledged !== 'accepted');
    } catch {
      setNeedsAcknowledgement(true);
    }
  }, [storageKey]);

  const accept = () => {
    try {
      window.localStorage.setItem(storageKey, 'accepted');
    } catch {
      // no-op: storage may be unavailable in privacy modes
    }
    setNeedsAcknowledgement(false);
  };

  if (!needsAcknowledgement) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="risk-ack-title">
      <div className="w-full max-w-xl rounded-2xl border border-orange-400/40 bg-[#111] p-5 shadow-2xl sm:p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-orange-300" />
          <div>
            <h2 id="risk-ack-title" className="text-sm font-extrabold uppercase tracking-[0.2em] text-orange-200">
              Safety Notice
            </h2>
            <p className="mt-2 text-sm leading-6 text-orange-50/95">
              DIY auto repair can cause serious injury, fire, or vehicle damage. Always verify OEM procedures and use proper safety equipment.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={accept}
          className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-orange-400 px-4 py-3 text-sm font-bold text-black transition hover:bg-orange-300"
        >
          I understand the risks - Proceed
        </button>
      </div>
    </div>
  );
}
