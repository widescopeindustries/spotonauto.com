

export const maxDuration = 45;
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  decodeVin,
  getVehicleInfo,
  generateFullRepairGuide,
  sendDiagnosticMessageWithHistory
} from '@/services/geminiService';

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    console.error("SERVER ERROR: GEMINI_API_KEY is not set.");
    return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { action, payload, stream } = body;
    console.log(`API Request: ${action}, vehicle: ${payload.vehicle?.year} ${payload.vehicle?.make} ${payload.vehicle?.model}`);

    if (!action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 });
    }

    let result;

    switch (action) {
      case 'decode-vin':
        result = await decodeVin(payload.vin);
        break;

      case 'vehicle-info':
        result = await getVehicleInfo(payload.vehicle, payload.task);
        if (result.sources && result.sources.length > 0) {
          console.log(`✓ Grounded in ${result.sources.length} sources from charm.li`);
        }
        break;

      case 'generate-guide':
        result = await generateFullRepairGuide(payload.vehicle, payload.task);
        if (result.sources && result.sources.length > 0) {
          console.log(`✓ Guide grounded in ${result.sources.length} sources`);
        }
        break;

      case 'diagnostic-chat':
        // For diagnostic chat, we need to reconstruct the chat with history
        result = await sendDiagnosticMessageWithHistory(
          payload.vehicle,
          payload.message,
          payload.history || []
        );
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('API Handler Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
