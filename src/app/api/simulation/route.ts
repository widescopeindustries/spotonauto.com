import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { getSimulationRun, listSimulationRuns } from '@/lib/simulation/store';
import {
  chatWithReportAgent,
  chatWithSimulationActor,
  createSimulationRun,
  generateSimulationReport,
  startSimulationRun,
} from '@/lib/simulation/orchestrator';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, 30, 60_000);
  if (limited) return limited;

  try {
    const body = await req.json();
    const { action, payload = {} } = body as {
      action?: string;
      payload?: Record<string, any>;
    };

    if (!action) {
      return NextResponse.json({ error: 'Missing simulation action' }, { status: 400 });
    }

    switch (action) {
      case 'create-run': {
        if (!payload.title || !payload.seedText) {
          return NextResponse.json({ error: 'Missing title or seedText' }, { status: 400 });
        }

        const run = await createSimulationRun({
          title: String(payload.title),
          seedText: String(payload.seedText),
          collectiveMemory: payload.collectiveMemory ? String(payload.collectiveMemory) : undefined,
        });

        return NextResponse.json({ run });
      }

      case 'get-run': {
        const run = payload.runId ? getSimulationRun(String(payload.runId)) : null;
        if (!run) {
          return NextResponse.json({ error: 'Simulation run not found' }, { status: 404 });
        }
        return NextResponse.json({ run });
      }

      case 'list-runs':
        return NextResponse.json({ runs: listSimulationRuns().slice(0, 12) });

      case 'start-simulation': {
        const run = await startSimulationRun(String(payload.runId || ''), Number(payload.turnCount || 2));
        if (!run) {
          return NextResponse.json({ error: 'Simulation run not found' }, { status: 404 });
        }
        return NextResponse.json({ run });
      }

      case 'generate-report': {
        const run = await generateSimulationReport(String(payload.runId || ''));
        if (!run) {
          return NextResponse.json({ error: 'Simulation run not found' }, { status: 404 });
        }
        return NextResponse.json({ run });
      }

      case 'chat': {
        const runId = String(payload.runId || '');
        const messages = Array.isArray(payload.messages) ? payload.messages : [];
        const mode = payload.mode === 'report' ? 'report' : 'actor';

        if (messages.length === 0) {
          return NextResponse.json({ error: 'Missing chat history' }, { status: 400 });
        }

        const reply = mode === 'report'
          ? await chatWithReportAgent(runId, messages)
          : await chatWithSimulationActor(runId, String(payload.actorId || ''), messages);

        if (!reply) {
          return NextResponse.json({ error: 'Simulation run or actor not found' }, { status: 404 });
        }

        return NextResponse.json({ reply });
      }

      default:
        return NextResponse.json({ error: 'Invalid simulation action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[SIMULATION API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Simulation request failed' },
      { status: 500 },
    );
  }
}
