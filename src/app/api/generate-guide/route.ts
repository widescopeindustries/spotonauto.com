
export const maxDuration = 120;
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { logWarn } from "@/lib/logger";
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

function isBot(req: NextRequest): boolean {
  const ua = req.headers.get('user-agent') || '';
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /meta-externalagent/i,
    /ClaudeBot/i,
    /Amazonbot/i,
    /Applebot/i,
    /GPTBot/i,
    /CCBot/i,
    /ChatGPT-User/i,
    /bingbot/i,
    /googlebot/i,
    /yandex/i,
    /baiduspider/i,
    /facebookexternalhit/i,
    /slackbot/i,
    /twitterbot/i,
    /linkedinbot/i,
    /embedly/i,
    /quora link preview/i,
    /showyoubot/i,
    /outbrain/i,
    /pinterest/i,
    /vkshare/i,
    /w3c_validator/i,
  ];
  return botPatterns.some((p) => p.test(ua));
}

export async function POST(req: NextRequest) {
  try {
    // Reject crawlers immediately — they should not trigger AI guide generation
    if (isBot(req)) {
      return NextResponse.json(
        { error: 'Bots are not permitted to use guide generation.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, payload = {}, stream, turnstileToken } = body;

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';

    // Verify Turnstile for expensive actions
    if (action === 'generate-guide') {
      if (!turnstileToken) {
        return NextResponse.json({ error: 'Missing security token' }, { status: 400 });
      }

      const turnstileSecret = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA'; // fallback to test key
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: turnstileSecret,
          response: turnstileToken,
          remoteip: ip,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        logWarn(`[Turnstile] Validation failed for IP ${ip}: ${JSON.stringify(verifyData['error-codes'])}`);
        return NextResponse.json({ error: 'Security validation failed' }, { status: 403 });
      }
    }

    const limited = checkRateLimit(req, 10, 60_000); // 10 actions/min per IP
    if (limited) return limited;

    if (!action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 });
    }

    const requiresAiProvider = action !== 'decode-vin';
    const hasCloudProvider = process.env.KIMI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    const hasOllama = process.env.OLLAMA_BASE_URL;
    if (requiresAiProvider && !hasCloudProvider && !hasOllama) {
      console.error("SERVER ERROR: No AI provider key is set. Configure KIMI_API_KEY, GEMINI_API_KEY, OPENAI_API_KEY, or OLLAMA_BASE_URL.");
      return NextResponse.json({ error: 'Server configuration error: Missing AI API key' }, { status: 500 });
    }

    const localUserId = req.headers.get('x-spoton-user-id') || 'anonymous';
    console.log(`API Request [user:${localUserId}]: ${action}, vehicle: ${payload.vehicle?.year} ${payload.vehicle?.make} ${payload.vehicle?.model}`);

    // Validate vehicle for actions that require it
    if (['vehicle-info', 'generate-guide', 'diagnostic-chat'].includes(action)) {
      const { vehicle, task } = payload;
      if (!vehicle || !vehicle.year || !vehicle.make || !vehicle.model) {
        return NextResponse.json({ error: 'Missing vehicle information' }, { status: 400 });
      }

      // For vehicle-info and generate-guide, validate against our database
      if (action === 'vehicle-info' || action === 'generate-guide') {
        if (!isValidVehicleCombination(vehicle.year, vehicle.make, vehicle.model, task || 'unknown')) {
          logWarn(`[API] Rejected invalid vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}`);
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
