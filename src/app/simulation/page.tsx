'use client';

import { useMemo, useState } from 'react';
import { Loader2, MessageSquareText, Network, Orbit, Play, ScrollText, Users2 } from 'lucide-react';
import { PersonaProfile, SimulationChatMessage, SimulationRun } from '@/lib/simulation/types';

type BusyState = 'idle' | 'creating' | 'simulating' | 'reporting' | 'chatting';

async function postSimulation(action: string, payload: Record<string, unknown>) {
  const response = await fetch('/api/simulation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Simulation request failed');
  }

  return data;
}

const DEFAULT_SEED = `Port Sentinel is a coastal city navigating a labor strike, a port automation rollout, and an election six weeks away. Mayor Elena Voss is pushing the rollout as an economic reset. Union president Marcus Vale argues the automation contract was negotiated in secret and will erase hundreds of jobs. HarborShield Logistics says a ransomware scare last quarter exposed the need for new systems.

Local journalist Priya Nasser has published leaked messages suggesting the city manager coordinated with HarborShield before the public hearings. Community organizer Talia Brooks is trying to keep neighborhoods from splitting along dockworker versus small-business lines. Police chief Owen Pike is privately worried that a protest crackdown would fracture public trust for years.

Investors want the rollout on schedule. Families tied to the port want guarantees, retraining, and a credible public explanation. Everyone remembers the refinery closure ten years ago and how quickly public promises evaporated afterward.`;

export default function SimulationPage() {
  const [title, setTitle] = useState('Port Sentinel');
  const [seedText, setSeedText] = useState(DEFAULT_SEED);
  const [collectiveMemory, setCollectiveMemory] = useState('The refinery closure is still the defining civic betrayal in living memory.');
  const [run, setRun] = useState<SimulationRun | null>(null);
  const [busy, setBusy] = useState<BusyState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<'actor' | 'report'>('actor');
  const [selectedActorId, setSelectedActorId] = useState<string>('');
  const [draftMessage, setDraftMessage] = useState('What changed after the last turn?');
  const [chatMessages, setChatMessages] = useState<SimulationChatMessage[]>([]);

  const selectedActor = useMemo(
    () => run?.personas.find((persona) => persona.id === selectedActorId) || null,
    [run, selectedActorId],
  );

  const handleCreateRun = async () => {
    setBusy('creating');
    setError(null);

    try {
      const data = await postSimulation('create-run', { title, seedText, collectiveMemory });
      const nextRun = data.run as SimulationRun;
      setRun(nextRun);
      setSelectedActorId(nextRun.personas[0]?.id || '');
      setChatMessages([]);
      setChatMode(nextRun.personas[0] ? 'actor' : 'report');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to build simulation graph');
    } finally {
      setBusy('idle');
    }
  };

  const handleStartSimulation = async () => {
    if (!run) return;
    setBusy('simulating');
    setError(null);

    try {
      const data = await postSimulation('start-simulation', { runId: run.id, turnCount: 2 });
      setRun(data.run as SimulationRun);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start simulation');
    } finally {
      setBusy('idle');
    }
  };

  const handleGenerateReport = async () => {
    if (!run) return;
    setBusy('reporting');
    setError(null);

    try {
      const data = await postSimulation('generate-report', { runId: run.id });
      setRun(data.run as SimulationRun);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setBusy('idle');
    }
  };

  const handleSendMessage = async () => {
    if (!run || !draftMessage.trim()) return;
    if (chatMode === 'actor' && !selectedActorId) return;

    const nextMessages: SimulationChatMessage[] = [...chatMessages, { role: 'user', content: draftMessage.trim() }];
    setChatMessages(nextMessages);
    setDraftMessage('');
    setBusy('chatting');
    setError(null);

    try {
      const data = await postSimulation('chat', {
        runId: run.id,
        mode: chatMode,
        actorId: selectedActorId,
        messages: nextMessages,
      });

      setChatMessages([...nextMessages, { role: 'assistant', content: String(data.reply || '') }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send chat message');
      setChatMessages(nextMessages);
    } finally {
      setBusy('idle');
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_30%),linear-gradient(180deg,_#120f0c_0%,_#050505_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-amber-300/20 bg-black/35 p-6 shadow-[0_24px_120px_rgba(0,0,0,0.45)] backdrop-blur">
            <div className="flex items-center gap-3 text-amber-300">
              <Orbit className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-[0.32em]">Simulation Sandbox</span>
            </div>
            <h1 className="mt-4 max-w-3xl font-serif text-4xl tracking-tight text-white sm:text-5xl">
              Reality Seed Extraction, GraphRAG construction, dual-platform simulation, and report-agent chat.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-300 sm:text-base">
              This first pass builds a world model from seed text, injects collective memory, runs parallel simulation turns, generates a report, and lets you chat with either an individual inside the world or the report layer.
            </p>

            <div className="mt-8 grid gap-4">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">World Title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-300/50"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">Reality Seed</span>
                <textarea
                  value={seedText}
                  onChange={(event) => setSeedText(event.target.value)}
                  rows={12}
                  className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-7 text-white outline-none transition focus:border-amber-300/50"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">Collective Memory Injection</span>
                <textarea
                  value={collectiveMemory}
                  onChange={(event) => setCollectiveMemory(event.target.value)}
                  rows={3}
                  className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-7 text-white outline-none transition focus:border-amber-300/50"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCreateRun}
                disabled={busy !== 'idle'}
                className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-black transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === 'creating' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Network className="h-4 w-4" />}
                Build Graph
              </button>
              <button
                type="button"
                onClick={handleStartSimulation}
                disabled={!run || busy !== 'idle'}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === 'simulating' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Start Simulation
              </button>
              <button
                type="button"
                onClick={handleGenerateReport}
                disabled={!run || busy !== 'idle'}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === 'reporting' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScrollText className="h-4 w-4" />}
                Generate Report
              </button>
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_80px_rgba(0,0,0,0.35)] backdrop-blur">
            <div className="flex items-center gap-3 text-cyan-200">
              <Users2 className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-[0.32em]">State</span>
            </div>

            {run ? (
              <div className="mt-5 space-y-6">
                <div>
                  <h2 className="font-serif text-2xl text-white">{run.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-stone-300">{run.environment.summary}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-stone-500">Nodes</div>
                    <div className="mt-2 text-3xl font-semibold text-white">{run.graph.nodes.length}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-stone-500">Edges</div>
                    <div className="mt-2 text-3xl font-semibold text-white">{run.graph.edges.length}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-stone-500">Memories</div>
                    <div className="mt-2 text-3xl font-semibold text-white">{run.graph.memories.length}</div>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Personas</div>
                    <div className="mt-4 space-y-3">
                      {run.personas.map((persona) => (
                        <button
                          key={persona.id}
                          type="button"
                          onClick={() => {
                            setSelectedActorId(persona.id);
                            setChatMode('actor');
                          }}
                          className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                            persona.id === selectedActorId
                              ? 'border-amber-300/50 bg-amber-300/10'
                              : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                          }`}
                        >
                          <div className="font-semibold text-white">{persona.name}</div>
                          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-500">{persona.role}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Prediction Requirements</div>
                    <div className="mt-4 space-y-3">
                      {run.predictionRequirements.map((requirement) => (
                        <div key={requirement.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-semibold text-white">{requirement.title}</div>
                            <div className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-stone-400">
                              {requirement.priority}
                            </div>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-stone-300">{requirement.rationale}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {run.turns.length > 0 && (
                  <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Simulation Turns</div>
                    <div className="mt-4 space-y-3">
                      {run.turns.map((turn) => (
                        <div key={turn.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-semibold text-white">
                              {turn.platform} platform · turn {turn.turnNumber}
                            </div>
                            <div className="text-xs uppercase tracking-[0.18em] text-stone-500">
                              {turn.memoryUpdates.length} memory updates
                            </div>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-stone-300">{turn.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {run.report && (
                  <div className="rounded-3xl border border-emerald-300/20 bg-emerald-500/10 p-5">
                    <div className="flex items-center gap-3 text-emerald-200">
                      <ScrollText className="h-5 w-5" />
                      <span className="text-xs font-semibold uppercase tracking-[0.24em]">ReportAgent Output</span>
                    </div>
                    <h3 className="mt-4 font-serif text-2xl text-white">{run.report.headline}</h3>
                    <p className="mt-3 text-sm leading-7 text-emerald-50/85">{run.report.executiveSummary}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-black/20 p-6 text-sm leading-7 text-stone-400">
                Build a run to see extracted nodes, personas, memories, simulation turns, and the report layer.
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_80px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 text-stone-300">
                <MessageSquareText className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-[0.3em]">Deep Interaction</span>
              </div>
              <h2 className="mt-3 font-serif text-2xl text-white">
                Chat with an individual in the simulated world or with ReportAgent.
              </h2>
            </div>

            <div className="flex gap-2 rounded-full border border-white/10 bg-black/20 p-1">
              <button
                type="button"
                onClick={() => setChatMode('actor')}
                className={`rounded-full px-4 py-2 text-sm transition ${chatMode === 'actor' ? 'bg-amber-300 text-black' : 'text-stone-300'}`}
              >
                Individual
              </button>
              <button
                type="button"
                onClick={() => setChatMode('report')}
                className={`rounded-full px-4 py-2 text-sm transition ${chatMode === 'report' ? 'bg-emerald-300 text-black' : 'text-stone-300'}`}
              >
                ReportAgent
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[0.34fr_0.66fr]">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Chat Context</div>
              {chatMode === 'actor' ? (
                selectedActor ? (
                  <div className="mt-4 space-y-3">
                    <div className="font-semibold text-white">{selectedActor.name}</div>
                    <div className="text-xs uppercase tracking-[0.18em] text-stone-500">{selectedActor.role}</div>
                    <p className="text-sm leading-7 text-stone-300">{selectedActor.voice}</p>
                  </div>
                ) : (
                  <div className="mt-4 text-sm text-stone-400">Select a persona after building a run.</div>
                )
              ) : (
                <div className="mt-4 text-sm leading-7 text-stone-300">
                  {run?.report?.executiveSummary || 'Generate a report to give ReportAgent more context.'}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <div className="space-y-3">
                <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
                  {chatMessages.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm text-stone-400">
                      Ask about intentions, hidden tensions, likely next moves, or why a report conclusion was reached.
                    </div>
                  ) : (
                    chatMessages.map((message, index) => (
                      <div
                        key={`${message.role}-${index}`}
                        className={`rounded-2xl px-4 py-3 text-sm leading-7 ${
                          message.role === 'user'
                            ? 'ml-auto max-w-[75%] bg-amber-300 text-black'
                            : 'max-w-[85%] border border-white/10 bg-white/[0.03] text-stone-200'
                        }`}
                      >
                        {message.content}
                      </div>
                    ))
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <textarea
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    rows={3}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-7 text-white outline-none transition focus:border-amber-300/40"
                    placeholder="Ask a persona or ReportAgent a specific question."
                  />
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!run || busy !== 'idle' || (chatMode === 'actor' && !selectedActorId)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy === 'chatting' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
