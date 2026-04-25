/**
 * Client-side API service for making secure server-side AI requests
 *
 * The self-hosted version no longer depends on external auth headers.
 */

import { Vehicle, VehicleInfo, RepairGuide } from '../types';

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

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('spotonauto-local-user-v1');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { id?: string };
        if (parsed?.id) {
          headers['x-spoton-user-id'] = parsed.id;
        }
      } catch {
        // ignore
      }
    }
  }
  return headers;
}

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

export const decodeVin = async (vin: string): Promise<Vehicle> => makeApiRequest('decode-vin', { vin });
export const getVehicleInfo = async (vehicle: Vehicle, task: string): Promise<VehicleInfo> =>
  makeApiRequest('vehicle-info', { vehicle, task });
export const generateFullRepairGuide = async (vehicle: Vehicle, task: string): Promise<RepairGuide> =>
  makeApiRequest('generate-guide', { vehicle, task });

export const generateStepImage = async (vehicle: string, instruction: string): Promise<string> => {
  const response = await fetch('/api/generate-step-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vehicle, instruction }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate image');
  }

  const data = await response.json();
  return data.imageUrl;
};

export const streamRepairGuide = async (
  vehicle: Vehicle,
  task: string,
  onUpdate: (chunk: any) => void
): Promise<RepairGuide> => {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'generate-guide', payload: { vehicle, task }, stream: true }),
  });

  if (!response.ok) {
    throw new Error(`Stream request failed: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: false });
  let fullGuide: RepairGuide | null = null;
  let buffer = '';

  if (!reader) throw new Error('Response body is not readable');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

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

export const getQuickPreview = async (vehicle: Vehicle, task: string) => makeApiRequest('quick-preview', { vehicle, task });

export const sendDiagnosticMessage = async (
  chat: Chat,
  message: string,
): Promise<{ text: string; imageUrl: string | null }> => {
  const response = await makeApiRequest('diagnostic-chat', {
    vehicle: chat.vehicle,
    message,
    history: chat.history,
  });
  return {
    text: response.text || response.instruction || response.message || '',
    imageUrl: response.imageUrl || null,
  };
};

export interface Chat {
  id: string;
  history: any[];
  vehicle: Vehicle;
}

function createChatId(): string {
  return `diag_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const createDiagnosticChat = (
  vehicle: Vehicle,
  options?: { id?: string; history?: any[] }
): Chat => ({
  id: options?.id || createChatId(),
  history: [...(options?.history || [])],
  vehicle,
});
