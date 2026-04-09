'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import CharmLiVehicleSelector from '@/components/CharmLiVehicleSelector';
import { VALID_TASKS, slugifyRoutePart } from '@/data/vehicles';

interface VehicleSelection {
  year: string;
  make: string;
  model: string;
}

interface ManualRouteResolution {
  path: string;
  exact: boolean;
}

export default function ManualNavigator() {
  const router = useRouter();
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleSelection | null>(null);
  const [selectedTask, setSelectedTask] = useState('');
  const [manualResolution, setManualResolution] = useState<ManualRouteResolution | null>(null);
  const [manualRouteLoading, setManualRouteLoading] = useState(false);

  const guideUrl = useMemo(() => {
    if (!selectedVehicle || !selectedTask) return '';
    const { year, make, model } = selectedVehicle;
    return `/repair/${year}/${slugifyRoutePart(make)}/${slugifyRoutePart(model)}/${selectedTask}`;
  }, [selectedTask, selectedVehicle]);

  useEffect(() => {
    if (!selectedVehicle) {
      setManualResolution(null);
      setManualRouteLoading(false);
      return;
    }

    const controller = new AbortController();

    setManualRouteLoading(true);
    void fetch(
      `/api/manual-coverage?action=resolve&year=${encodeURIComponent(selectedVehicle.year)}&make=${encodeURIComponent(selectedVehicle.make)}&model=${encodeURIComponent(selectedVehicle.model)}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Unable to resolve manual path');
        }
        return data as ManualRouteResolution;
      })
      .then((data) => {
        setManualResolution(data);
        setManualRouteLoading(false);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.warn('[manual-navigator] failed to resolve exact manual path', error);
        setManualResolution({
          path: `/manual/${encodeURIComponent(selectedVehicle.make)}/${encodeURIComponent(selectedVehicle.year)}`,
          exact: false,
        });
        setManualRouteLoading(false);
      });

    return () => controller.abort();
  }, [selectedVehicle]);

  const manualBrowseUrl = manualResolution?.path || '';
  const manualBrowseLabel = !selectedVehicle
    ? 'Open Factory Manuals'
    : manualRouteLoading
      ? 'Resolving Manual Branch...'
      : manualResolution?.exact
        ? `Open Exact Manual Branch For ${selectedVehicle.model}`
        : `Open ${selectedVehicle.year} ${selectedVehicle.make} Manual Index`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300 mb-4">
            Factory Manual Archive
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Manual Navigator
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto">
            Select a supported vehicle from the verified archive coverage map, then choose whether to
            browse the factory manual tree or generate a task-specific repair guide grounded in that archive.
          </p>
        </header>

        <CharmLiVehicleSelector
          onSelect={setSelectedVehicle}
          selectedTask={selectedTask}
        />

        {selectedVehicle && (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.05] p-6">
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-brand-cyan text-black rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </span>
                Browse The Manual Tree
              </h2>
              <p className="text-sm text-gray-300 mb-5">
                {manualResolution?.exact
                  ? `Open the exact archive branch we resolved for ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}.`
                  : `Start with the ${selectedVehicle.year} ${selectedVehicle.make} archive index, then drill into the exact variant, subsystem, diagram, or procedure you need.`}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (manualBrowseUrl) router.push(manualBrowseUrl);
                }}
                disabled={!manualBrowseUrl || manualRouteLoading}
                className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold uppercase tracking-wide text-black transition-all hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {manualBrowseLabel}
              </button>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </span>
                Generate A Repair Guide
              </h2>
              <p className="text-sm text-gray-300 mb-5">
                Pick a common repair task and route into the AI guide flow for this exact vehicle.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {VALID_TASKS.map((task) => (
                  <button
                    key={task}
                    type="button"
                    onClick={() => setSelectedTask(task)}
                    className={`p-3 rounded-lg text-sm font-medium transition-all ${
                      selectedTask === task
                        ? 'bg-brand-cyan text-black'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {task.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (guideUrl) router.push(guideUrl);
                }}
                disabled={!guideUrl}
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition-all hover:border-cyan-500/30 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guideUrl
                  ? `Open Guide For ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`
                  : 'Select A Task To Continue'}
              </button>
            </section>
          </div>
        )}

        <div className="mt-16 grid gap-6 md:grid-cols-3 text-center">
          <div className="p-6 bg-white/5 rounded-xl border border-white/10">
            <h3 className="font-bold text-white mb-2">Verified Coverage</h3>
            <p className="text-gray-400 text-sm">
              Only vehicles with confirmed archive coverage appear in the selector.
            </p>
          </div>
          <div className="p-6 bg-white/5 rounded-xl border border-white/10">
            <h3 className="font-bold text-white mb-2">Manual First</h3>
            <p className="text-gray-400 text-sm">
              Browse the archive tree directly before deciding whether you need AI synthesis.
            </p>
          </div>
          <div className="p-6 bg-white/5 rounded-xl border border-white/10">
            <h3 className="font-bold text-white mb-2">No Guessing</h3>
            <p className="text-gray-400 text-sm">
              If a vehicle is not covered, the navigator says that plainly instead of fabricating support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
