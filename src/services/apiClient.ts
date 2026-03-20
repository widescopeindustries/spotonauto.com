/**
 * Client-side API service for making secure server-side AI requests
 * This ensures API keys are never exposed to the client
 */

import { Vehicle, VehicleInfo, RepairGuide } from '../types';
import { supabase } from '../lib/supabaseClient';

const API_ENDPOINT = '/api/generate-guide';

function isAbortLikeMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('signal is aborted') ||
    normalized.includes('aborted without reason') ||
    normalized.includes('this operation was aborted') ||
    normalized.includes('the operation was aborted') ||
    normalized.includes('timeout') ||
    normalized.includes('timed out')
  );
}

function normalizeApiErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (isAbortLikeMessage(message)) {
    return 'Guide generation timed out while contacting an upstream service. Please try again.';
  }

  if (message === 'Failed to fetch') {
    return 'Unable to reach the guide service right now. Please try again.';
  }

  return message || 'Unknown error';
}

/**
 * Get auth headers for API requests (attaches Supabase JWT if logged in)
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch {
    // Silently fail - API route will return 401 if auth required
  }
  return headers;
}

/**
 * Makes a request to the server-side API
 */
function getClientLocale(): string {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem('spoton-locale') || 'en';
}

async function makeApiRequest(action: string, payload: any, options?: { stream?: boolean }) {
  const headers = await getAuthHeaders();
  const locale = getClientLocale();

  let response: Response;
  try {
    response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action, payload: { ...payload, locale }, stream: options?.stream }),
    });
  } catch (error) {
    throw new Error(normalizeApiErrorMessage(error));
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: `API request failed: ${response.statusText}` }));
    throw new Error(normalizeApiErrorMessage(error.error));
  }

  return response.json();
}

/**
 * Decode a VIN to get vehicle information
 */
export const decodeVin = async (vin: string): Promise<Vehicle> => {
  return makeApiRequest('decode-vin', { vin });
};

/**
 * Get vehicle information including TSBs, recalls, and job snapshot
 */
export const getVehicleInfo = async (vehicle: Vehicle, task: string): Promise<VehicleInfo> => {
  return makeApiRequest('vehicle-info', { vehicle, task });
};

/**
 * Generate a full repair guide with steps and images
 */
export const generateFullRepairGuide = async (vehicle: Vehicle, task: string): Promise<RepairGuide> => {
  return makeApiRequest('generate-guide', { vehicle, task });
};

/**
 * Generate an image for a specific repair step
 */
export const generateStepImage = async (vehicle: string, instruction: string): Promise<string> => {
  const authHeaders = await getAuthHeaders();
  const response = await fetch('/api/generate-step-image', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ vehicle, instruction }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate image');
  }

  const data = await response.json();
  return data.imageUrl;
};

/**
 * Stream guide generation for real-time updates
 */
export const streamRepairGuide = async (
  vehicle: Vehicle,
  task: string,
  onUpdate: (chunk: any) => void
): Promise<RepairGuide> => {
  const headers = await getAuthHeaders();
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'generate-guide', payload: { vehicle, task }, stream: true }),
  });

  if (!response.ok) {
    throw new Error(`Stream request failed: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: false });
  let fullGuide: RepairGuide | null = null;
  let buffer = '';

  if (!reader) {
    throw new Error('Response body is not readable');
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;

    // Process complete lines
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          onUpdate(data);

          if (data.status === 'complete') {
            fullGuide = data.data;
          } else if (data.status === 'error') {
            throw new Error(data.error);
          }
        } catch (e) {
          console.warn('Failed to parse SSE data:', line, e);
        }
      }
    }
  }

  if (!fullGuide) throw new Error('Stream ended without a complete guide response');
  return fullGuide;
};

/**
 * Get quick preview of repair task
 */
export const getQuickPreview = async (vehicle: Vehicle, task: string) => {
  return makeApiRequest('quick-preview', { vehicle, task });
};

/**
 * Chat interface for diagnostic assistant
 */
export interface Chat {
  id: string;
  history: any[];
  vehicle: Vehicle;
}

function createChatId(): string {
  return `diag_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create a new diagnostic chat session
 */
export const createDiagnosticChat = (
  vehicle: Vehicle,
  options?: { id?: string; history?: any[] }
): Chat => {
  return {
    id: options?.id || createChatId(),
    history: [...(options?.history || [])],
    vehicle,
  };
};

/**
 * Send a message in a diagnostic chat session
 */
export const sendDiagnosticMessage = async (
  chat: Chat,
  message: string
): Promise<{ text: string; imageUrl: string | null }> => {
  const response = await makeApiRequest('diagnostic-chat', {
    history: chat.history,
    message,
    vehicle: chat.vehicle,
  });

  chat.history.push(
    { role: 'user', parts: [{ text: message }] },
    { role: 'model', parts: [{ text: response.text }] }
  );

  return response;
};

/**
 * Send a diagnostic message (alias for sendDiagnosticMessage for compatibility)
 */
export const sendDiagnosticMessageWithHistory = sendDiagnosticMessage;
