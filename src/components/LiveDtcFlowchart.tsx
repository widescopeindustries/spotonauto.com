'use client';

import { useEffect, useRef, useState } from 'react';
import type { LiveDtcFlowchart } from '@/types/dtc-flowchart';

interface LiveDtcFlowchartProps {
  code: string;
}

export default function LiveDtcFlowchart({ code }: LiveDtcFlowchartProps) {
  const [flow, setFlow] = useState<LiveDtcFlowchart | null>(null);
  const [loading, setLoading] = useState(false);
  const [nearViewport, setNearViewport] = useState(false);
  const hostRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!nearViewport) return;

    let active = true;
    const controller = new AbortController();
    setLoading(true);

    async function load() {
      try {
        const resp = await fetch(`/api/dtc-flow?code=${encodeURIComponent(code)}`, {
          signal: controller.signal,
          cache: 'force-cache',
        });
        if (!resp.ok) return;
        const payload = await resp.json();
        if (!active) return;
        setFlow(payload?.flow || null);
      } catch {
        if (!active) return;
        setFlow(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    if (typeof requestIdleCallback !== 'undefined') {
      const idleId = requestIdleCallback(load, { timeout: 2000 });
      return () => {
        active = false;
        controller.abort();
        cancelIdleCallback(idleId);
      };
    }

    const timer = window.setTimeout(load, 100);
    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [code, nearViewport]);

  if (!nearViewport && !flow) {
    return (
      <section ref={hostRef} className="mb-8 bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-6">
        <h3 className="text-lg font-bold text-indigo-300">OEM Diagnostic Flowchart</h3>
        <p className="text-gray-300 text-sm mt-2">Scroll to load technician if/then branches.</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section ref={hostRef} className="mb-8 bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-6">
        <h3 className="text-lg font-bold text-indigo-300">OEM Diagnostic Flowchart</h3>
        <p className="text-gray-300 text-sm mt-2">Loading technician if/then branches...</p>
      </section>
    );
  }

  if (!flow || flow.steps.length === 0) {
    return null;
  }

  return (
    <section ref={hostRef} className="mb-8 bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-indigo-300">OEM Diagnostic Flowchart (If / Then)</h3>
        <p className="text-gray-300 text-sm mt-1">
          Source: {flow.sourceVehicle || 'Factory service manual'}
        </p>
        <a
          href={flow.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-xs text-indigo-200 hover:text-indigo-100 underline"
        >
          Open source flowchart in manual
        </a>
      </div>

      {(flow.whenMonitored || flow.setCondition) && (
        <div className="mb-5 grid md:grid-cols-2 gap-3">
          {flow.whenMonitored && (
            <div className="rounded-lg bg-white/5 border border-white/10 p-3">
              <p className="text-xs uppercase tracking-wider text-indigo-200 font-bold mb-1">When Monitored</p>
              <p className="text-gray-200 text-sm">{flow.whenMonitored}</p>
            </div>
          )}
          {flow.setCondition && (
            <div className="rounded-lg bg-white/5 border border-white/10 p-3">
              <p className="text-xs uppercase tracking-wider text-indigo-200 font-bold mb-1">Set Condition</p>
              <p className="text-gray-200 text-sm">{flow.setCondition}</p>
            </div>
          )}
        </div>
      )}

      {flow.possibleCauses.length > 0 && (
        <div className="mb-5">
          <p className="text-xs uppercase tracking-wider text-indigo-200 font-bold mb-2">Possible Causes</p>
          <div className="flex flex-wrap gap-2">
            {flow.possibleCauses.slice(0, 10).map((cause) => (
              <span
                key={cause}
                className="px-2.5 py-1 rounded-full bg-white/5 border border-white/15 text-gray-200 text-xs"
              >
                {cause}
              </span>
            ))}
          </div>
        </div>
      )}

      <ol className="space-y-3">
        {flow.steps.map((step) => (
          <li key={`${step.step}-${step.title}`} className="rounded-lg bg-white/5 border border-white/15 p-4">
            <div className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-500/25 text-indigo-200 text-xs font-bold flex items-center justify-center mt-0.5">
                {step.step}
              </span>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm">{step.title}</p>
                {step.question && <p className="text-gray-200 text-sm mt-2">{step.question}</p>}

                {step.details.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {step.details.slice(0, 4).map((detail) => (
                      <li key={detail} className="text-gray-300 text-xs leading-relaxed">
                        {detail}
                      </li>
                    ))}
                  </ul>
                )}

                {(step.yesAction || step.noAction) && (
                  <div className="mt-3 grid sm:grid-cols-2 gap-2">
                    {step.yesAction && (
                      <div className="rounded-md bg-green-500/10 border border-green-400/30 px-3 py-2">
                        <p className="text-[11px] uppercase font-bold text-green-300">If Yes</p>
                        <p className="text-xs text-green-100 mt-1">{step.yesAction}</p>
                      </div>
                    )}
                    {step.noAction && (
                      <div className="rounded-md bg-amber-500/10 border border-amber-400/30 px-3 py-2">
                        <p className="text-[11px] uppercase font-bold text-amber-300">If No</p>
                        <p className="text-xs text-amber-100 mt-1">{step.noAction}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
