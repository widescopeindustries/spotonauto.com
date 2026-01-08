
import { Vehicle, VehicleInfo, RepairGuide } from '../types';

// We need a custom type to mimic the 'Chat' interface for the UI, 
// even though the backend is stateless-ish (we pass history).
export interface Chat {
  history: { role: string, parts: { text: string }[] }[];
  vehicle: Vehicle;
  sendMessage: (msg: { message: string }) => Promise<{ text: string }>; // method signature to match usage if needed, or we adapt UI
}

// Since the original UI used `ai.chats.create` return type, we might need to adapt.
// Existing usage: `const chat = createDiagnosticChat(vehicle);` 
// `const response = await sendDiagnosticMessage(chat, input);`
// `sendDiagnosticMessage` implementation in original file returned `{ text, imageUrl }`.
// I will keep the function signatures compatible with the UI as much as possible.

const API_ENDPOINT = '/api/generate-guide';

async function callApi(action: string, payload: any) {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, payload }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'API Request Failed');
  }
  return response.json();
}

export const decodeVin = async (vin: string): Promise<Vehicle> => {
  return callApi('decode-vin', { vin });
};

export const getVehicleInfo = async (vehicle: Vehicle, task: string): Promise<VehicleInfo> => {
  return callApi('vehicle-info', { vehicle, task });
};

export const generateFullRepairGuide = async (vehicle: Vehicle, task: string): Promise<RepairGuide> => {
  return callApi('generate-guide', { vehicle, task });
};

// --- Diagnostic Chat Wrapper ---

// The UI likely expects a specific object structure. 
// I'll define a simple object that holds the history.
export const createDiagnosticChat = (vehicle: Vehicle): Chat => {
  return {
    history: [], // Start empty
    vehicle: vehicle,
    sendMessage: async () => ({ text: '' }) // Dummy, not used directly by `sendDiagnosticMessage` usually, but checked by types
  };
};

export const sendDiagnosticMessage = async (chat: Chat, message: string): Promise<{ text: string, imageUrl: string | null }> => {
  // Call the API with current history and new message
  const result = await callApi('diagnostic-chat', {
    history: chat.history,
    message,
    vehicle: chat.vehicle
  });

  // Update local history
  chat.history.push({ role: 'user', parts: [{ text: message }] });
  chat.history.push({ role: 'model', parts: [{ text: JSON.stringify({ instruction: result.text, imagePrompt: "..." }) }] }); // We store the mock JSON response in history so the AI context stays valid? 
  // Actually, simpler to just store the text content if the system instruction handles formatting. 
  // The server instruction says "You MUST format...". So the history should probably contain the JSON string.

  return result;
};