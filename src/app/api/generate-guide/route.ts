
export const maxDuration = 45;
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rateLimit';
import {
  decodeVin,
  getVehicleInfo,
  generateFullRepairGuide,
  sendDiagnosticMessageWithHistory
} from '@/services/geminiService';
import { isValidVehicleCombination } from '@/data/vehicles';

function isAbortLikeError(error: unknown): boolean {
  if (!error) return false;
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const name = error instanceof Error ? error.name.toLowerCase() : '';
  return (
    name.includes('abort') ||
    name.includes('timeout') ||
    message.includes('signal is aborted') ||
    message.includes('aborted without reason') ||
    message.includes('this operation was aborted') ||
    message.includes('the operation was aborted') ||
    message.includes('timed out') ||
    message.includes('timeout')
  );
}

function toSafeApiErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (isAbortLikeError(error)) {
    return 'Guide generation timed out while contacting an upstream service. Please try again.';
  }

  if (
    message.includes('resource_exhausted') ||
    message.includes('quota') ||
    message.includes('rate limit') ||
    message.includes('429')
  ) {
    return 'Guide generation is temporarily unavailable because the AI service is rate-limited. Please try again shortly.';
  }

  if (
    message.includes('gemini api key is unavailable') ||
    message.includes('openai api key is missing') ||
    message.includes('missing ai api key')
  ) {
    return 'Guide generation is temporarily unavailable because the AI provider is not configured correctly.';
  }

  return error instanceof Error ? error.message : 'Internal Server Error';
}

// Admin client used solely to verify JWT tokens server-side (no user-context queries)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
  { auth: { persistSession: false } }
);

/**
 * Verify the request is from a logged-in Supabase user.
 * Returns the user object if valid, null otherwise.
 */
async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7); // remove "Bearer "
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload = {}, stream } = body;

    const limited = checkRateLimit(req, 10, 60_000); // 10 actions/min per IP
    if (limited) return limited;

    if (!action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 });
    }

    const requiresAiProvider = action !== 'decode-vin';
    if (requiresAiProvider && !process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
      console.error("SERVER ERROR: No AI provider key is set. Configure GEMINI_API_KEY or OPENAI_API_KEY.");
      return NextResponse.json({ error: 'Server configuration error: Missing AI API key' }, { status: 500 });
    }

    const user = await getAuthenticatedUser(req);
    console.log(`API Request [user:${user?.id ?? 'anonymous'}]: ${action}, vehicle: ${payload.vehicle?.year} ${payload.vehicle?.make} ${payload.vehicle?.model}`);

    // Validate vehicle for actions that require it
    if (['vehicle-info', 'generate-guide', 'diagnostic-chat'].includes(action)) {
      const { vehicle, task } = payload;
      if (!vehicle || !vehicle.year || !vehicle.make || !vehicle.model) {
        return NextResponse.json({ error: 'Missing vehicle information' }, { status: 400 });
      }

      // For vehicle-info and generate-guide, validate against our database
      if (action === 'vehicle-info' || action === 'generate-guide') {
        if (!isValidVehicleCombination(vehicle.year, vehicle.make, vehicle.model, task || 'unknown')) {
          console.warn(`[API] Rejected invalid vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}`);
          return NextResponse.json(
            { error: `Invalid vehicle combination: ${vehicle.year} ${vehicle.make} ${vehicle.model} did not exist or is not supported.` },
            { status: 400 }
          );
        }
      }

    }

    let result;

    switch (action) {
      case 'decode-vin':
        result = await decodeVin(payload.vin);
        break;

      case 'vehicle-info':
        result = await getVehicleInfo(payload.vehicle, payload.task);
        if (result.sources && result.sources.length > 0) {
          console.log(`✓ Grounded in ${result.sources.length} factory manual archive sources`);
        }
        console.log(
          `[RETRIEVAL] vehicle-info mode=${result.retrieval?.manualMode || 'none'} ` +
          `manual_sources=${result.retrieval?.manualSourceCount || 0} ` +
          `confidence=${(result.retrieval?.manualConfidence ?? 0).toFixed(3)} ` +
          `gate_reason=${result.retrieval?.manualGateReason || 'none'}`
        );
        break;

      case 'generate-guide':
        result = await generateFullRepairGuide(payload.vehicle, payload.task, payload.locale);
        if (result.sources && result.sources.length > 0) {
          console.log(`✓ Guide grounded in ${result.sources.length} sources`);
        }
        console.log(
          `[RETRIEVAL] generate-guide mode=${result.retrieval?.manualMode || 'none'} ` +
          `manual_sources=${result.retrieval?.manualSourceCount || 0} ` +
          `confidence=${(result.retrieval?.manualConfidence ?? 0).toFixed(3)} ` +
          `gate_reason=${result.retrieval?.manualGateReason || 'none'}`
        );
        break;

      case 'diagnostic-chat':
        // For diagnostic chat, we need to reconstruct the chat with history
        result = await sendDiagnosticMessageWithHistory(
          payload.vehicle,
          payload.message,
          payload.history || [],
          payload.locale
        );
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('API Handler Error:', error);
    return NextResponse.json(
      { error: toSafeApiErrorMessage(error) },
      { status: isAbortLikeError(error) ? 504 : 500 }
    );
  }
}
