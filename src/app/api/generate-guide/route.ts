

export const maxDuration = 60; // Allow 60 seconds for AI generation
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  decodeVin,
  getVehicleInfo,
  generateFullRepairGuide,
  createDiagnosticChat,
  sendDiagnosticMessage
} from '@/services/geminiService';

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    console.error("SERVER ERROR: GEMINI_API_KEY is not set.");
    return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { action, payload } = body;

    console.log(`API Request: ${action}`);

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
        break;

      case 'generate-guide':
        result = await generateFullRepairGuide(payload.vehicle, payload.task);
        break;

      case 'diagnostic-chat':
        const chat = createDiagnosticChat(payload.vehicle);
        // Note: History state is not yet fully persisted across calls in this stateless handler.
        // Future improvement: Pass payload.history into createDiagnosticChat
        result = await sendDiagnosticMessage(chat, payload.message);
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
