
export const maxDuration = 45;
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  decodeVin,
  getVehicleInfo,
  generateFullRepairGuide,
  sendDiagnosticMessageWithHistory
} from '@/services/geminiService';
import { isValidVehicleCombination } from '@/data/vehicles';

// Admin client used solely to verify JWT tokens server-side (no user-context queries)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

/**
 * Check if a user has an active Pro or Pro+ subscription.
 */
async function isProUser(userId: string): Promise<boolean> {
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('tier, status')
    .eq('user_id', userId)
    .single();

  return (
    subscription?.status === 'active' &&
    (subscription?.tier === 'pro' || subscription?.tier === 'pro_plus')
  );
}

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    console.error("SERVER ERROR: GEMINI_API_KEY is not set.");
    return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
  }

  // ── Authentication guard ──────────────────────────────────────────────────
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required. Please sign in to continue.' },
      { status: 401 }
    );
  }
  // ─────────────────────────────────────────────────────────────────────────

  try {
    const body = await req.json();
    const { action, payload, stream } = body;
    console.log(`API Request [user:${user.id}]: ${action}, vehicle: ${payload.vehicle?.year} ${payload.vehicle?.make} ${payload.vehicle?.model}`);

    if (!action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 });
    }

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

      // ── Server-side Pro enforcement for generate-guide ───────────────────
      // Pro users get unlimited; free users are rate-limited client-side.
      // This server check is an authoritative source of truth for Pro status.
      if (action === 'generate-guide') {
        const userIsPro = await isProUser(user.id);
        // Log for audit purposes (client-side limit still applies for free users)
        console.log(`[API] generate-guide: user=${user.id}, isPro=${userIsPro}`);
        // Future: enforce server-side usage limits for free tier here
      }
      // ────────────────────────────────────────────────────────────────────
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
