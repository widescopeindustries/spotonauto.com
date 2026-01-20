/**
 * Client-side API service for making secure server-side AI requests
 * This ensures API keys are never exposed to the client
 */

import { Vehicle, VehicleInfo, RepairGuide } from '../types';

const API_ENDPOINT = '/api/generate-guide';

/**
 * Makes a request to the server-side API
 */
async function makeApiRequest(action: string, payload: any) {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, payload }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API request failed: ${response.statusText}`);
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
 * Chat interface for diagnostic assistant
 */
export interface Chat {
  history: any[];
  vehicle: Vehicle;
}

/**
 * Create a new diagnostic chat session
 */
export const createDiagnosticChat = (vehicle: Vehicle): Chat => {
  return {
    history: [],
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

  // Update chat history with user message and AI response
  chat.history.push(
    { role: 'user', parts: [{ text: message }] },
    { role: 'model', parts: [{ text: response.text }] }
  );

  return response;
};
