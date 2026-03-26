/**
 * OBD2 ELM327 Bluetooth Low Energy protocol handler.
 *
 * Connects to an ELM327 BLE adapter via Web Bluetooth,
 * sends AT commands and OBD2 PID requests, parses responses.
 */

// Common ELM327 BLE service/characteristic UUIDs
// Different manufacturers use different UUIDs — we try multiple
const KNOWN_SERVICES = [
  '0000fff0-0000-1000-8000-00805f9b34fb', // Most common ELM327 BLE
  '000018f0-0000-1000-8000-00805f9b34fb', // Alternative
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Vgate/iCar
];

const WRITE_CHARACTERISTICS = [
  '0000fff1-0000-1000-8000-00805f9b34fb',
  '00002af0-0000-1000-8000-00805f9b34fb',
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
];

const NOTIFY_CHARACTERISTICS = [
  '0000fff2-0000-1000-8000-00805f9b34fb',
  '00002af1-0000-1000-8000-00805f9b34fb',
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f', // Some use same char for read/write
];

export interface OBD2Connection {
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer;
  writeChar: BluetoothRemoteGATTCharacteristic;
  notifyChar: BluetoothRemoteGATTCharacteristic;
}

export interface OBD2PIDResult {
  pid: string;
  name: string;
  value: number;
  unit: string;
  raw: string;
}

export interface OBD2DTC {
  code: string;
  status: 'stored' | 'pending';
}

// ─── Connection ─────────────────────────────────────────────────────────────

let responseBuffer = '';
let responseResolve: ((value: string) => void) | null = null;

function handleNotification(event: Event) {
  const target = event.target as BluetoothRemoteGATTCharacteristic;
  const value = target.value;
  if (!value) return;

  const decoder = new TextDecoder();
  const chunk = decoder.decode(value);
  responseBuffer += chunk;

  // ELM327 terminates responses with '>'
  if (responseBuffer.includes('>')) {
    const response = responseBuffer.replace(/>/g, '').trim();
    responseBuffer = '';
    if (responseResolve) {
      responseResolve(response);
      responseResolve = null;
    }
  }
}

function waitForResponse(timeoutMs = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    responseResolve = resolve;
    setTimeout(() => {
      if (responseResolve) {
        responseResolve = null;
        reject(new Error('OBD2 response timeout'));
      }
    }, timeoutMs);
  });
}

async function sendCommand(conn: OBD2Connection, cmd: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(cmd + '\r');
  const responsePromise = waitForResponse();
  await conn.writeChar.writeValue(data);
  return responsePromise;
}

export async function connectOBD2(
  onLog: (msg: string) => void,
): Promise<OBD2Connection> {
  onLog('Requesting Bluetooth device...');

  // Request any device that advertises one of our known services
  // Also accept any device with name containing 'OBD', 'ELM', 'Vgate', etc.
  const device = await navigator.bluetooth.requestDevice({
    filters: [
      { namePrefix: 'OBD' },
      { namePrefix: 'ELM' },
      { namePrefix: 'Vgate' },
      { namePrefix: 'iCar' },
      { namePrefix: 'TOPDON' },
      { namePrefix: 'V-LINK' },
    ],
    optionalServices: KNOWN_SERVICES,
  }).catch(() => {
    // If name filters fail, try accepting all devices
    return navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: KNOWN_SERVICES,
    });
  });

  onLog(`Found device: ${device.name || 'Unknown'}`);

  onLog('Connecting to GATT server...');
  const server = await device.gatt!.connect();

  // Find the right service and characteristics
  let writeChar: BluetoothRemoteGATTCharacteristic | null = null;
  let notifyChar: BluetoothRemoteGATTCharacteristic | null = null;

  for (const serviceUUID of KNOWN_SERVICES) {
    try {
      const service = await server.getPrimaryService(serviceUUID);
      onLog(`Found service: ${serviceUUID.slice(0, 8)}...`);

      // Try to find write characteristic
      for (const charUUID of WRITE_CHARACTERISTICS) {
        try {
          writeChar = await service.getCharacteristic(charUUID);
          onLog(`Write char: ${charUUID.slice(0, 8)}...`);
          break;
        } catch { /* try next */ }
      }

      // Try to find notify characteristic
      for (const charUUID of NOTIFY_CHARACTERISTICS) {
        try {
          notifyChar = await service.getCharacteristic(charUUID);
          onLog(`Notify char: ${charUUID.slice(0, 8)}...`);
          break;
        } catch { /* try next */ }
      }

      if (writeChar && notifyChar) break;
    } catch { /* try next service */ }
  }

  if (!writeChar || !notifyChar) {
    // Fallback: enumerate all services and characteristics
    onLog('Known UUIDs failed, scanning all services...');
    const services = await server.getPrimaryServices();
    for (const service of services) {
      onLog(`Service: ${service.uuid}`);
      const chars = await service.getCharacteristics();
      for (const char of chars) {
        onLog(`  Char: ${char.uuid} props: ${JSON.stringify(char.properties)}`);
        if (char.properties.write || char.properties.writeWithoutResponse) {
          writeChar = char;
        }
        if (char.properties.notify) {
          notifyChar = char;
        }
      }
    }
  }

  if (!writeChar || !notifyChar) {
    throw new Error('Could not find OBD2 characteristics. Device may not be BLE compatible.');
  }

  // Start notifications
  await notifyChar.startNotifications();
  notifyChar.addEventListener('characteristicvaluechanged', handleNotification);
  onLog('Notifications started');

  const conn: OBD2Connection = { device, server, writeChar, notifyChar };

  // Initialize ELM327
  onLog('Initializing ELM327...');
  await sendCommand(conn, 'ATZ').catch(() => {}); // Reset (may timeout)
  await new Promise(r => setTimeout(r, 1000)); // Wait for reset

  const version = await sendCommand(conn, 'ATI').catch(() => 'unknown');
  onLog(`ELM327: ${version}`);

  await sendCommand(conn, 'ATE0'); // Echo off
  await sendCommand(conn, 'ATL0'); // Linefeeds off
  await sendCommand(conn, 'ATS0'); // Spaces off
  await sendCommand(conn, 'ATH0'); // Headers off
  await sendCommand(conn, 'ATSP0'); // Auto-detect protocol

  // Test connection to vehicle
  const supported = await sendCommand(conn, '0100');
  if (supported.includes('NO DATA') || supported.includes('UNABLE')) {
    onLog('⚠ No vehicle connection — is ignition ON?');
  } else {
    onLog('✓ Vehicle connected');
  }

  return conn;
}

export function disconnectOBD2(conn: OBD2Connection) {
  try {
    conn.notifyChar.removeEventListener('characteristicvaluechanged', handleNotification);
    conn.server.disconnect();
  } catch { /* ignore */ }
}

// ─── PID Reading ────────────────────────────────────────────────────────────

const PID_DEFINITIONS: Record<string, {
  name: string;
  unit: string;
  parse: (bytes: number[]) => number;
}> = {
  '0105': {
    name: 'Coolant Temp',
    unit: '°F',
    parse: ([a]) => Math.round((a - 40) * 9 / 5 + 32),
  },
  '010C': {
    name: 'RPM',
    unit: 'rpm',
    parse: ([a, b]) => Math.round((a * 256 + b) / 4),
  },
  '010D': {
    name: 'Speed',
    unit: 'mph',
    parse: ([a]) => Math.round(a * 0.621371),
  },
  '010F': {
    name: 'Intake Temp',
    unit: '°F',
    parse: ([a]) => Math.round((a - 40) * 9 / 5 + 32),
  },
  '0111': {
    name: 'Throttle',
    unit: '%',
    parse: ([a]) => Math.round(a * 100 / 255),
  },
  '0104': {
    name: 'Engine Load',
    unit: '%',
    parse: ([a]) => Math.round(a * 100 / 255),
  },
  '010E': {
    name: 'Timing Advance',
    unit: '°',
    parse: ([a]) => Math.round(a / 2 - 64),
  },
  '0106': {
    name: 'Short Fuel Trim B1',
    unit: '%',
    parse: ([a]) => Math.round((a - 128) * 100 / 128),
  },
  '0107': {
    name: 'Long Fuel Trim B1',
    unit: '%',
    parse: ([a]) => Math.round((a - 128) * 100 / 128),
  },
  '0114': {
    name: 'O2 B1S1 Voltage',
    unit: 'V',
    parse: ([a]) => +(a / 200).toFixed(2),
  },
  '0115': {
    name: 'O2 B1S2 Voltage',
    unit: 'V',
    parse: ([a]) => +(a / 200).toFixed(2),
  },
  '012F': {
    name: 'Fuel Level',
    unit: '%',
    parse: ([a]) => Math.round(a * 100 / 255),
  },
  '0142': {
    name: 'Battery Voltage',
    unit: 'V',
    parse: ([a, b]) => +((a * 256 + b) / 1000).toFixed(1),
  },
  '0146': {
    name: 'Ambient Temp',
    unit: '°F',
    parse: ([a]) => Math.round((a - 40) * 9 / 5 + 32),
  },
};

function parseHexBytes(response: string): number[] {
  // Response format: "4105XX" where 41=response, 05=PID, XX=data
  const clean = response.replace(/[\s\r\n]/g, '');
  // Skip the first 4 chars (mode+PID echo)
  const dataHex = clean.slice(4);
  const bytes: number[] = [];
  for (let i = 0; i < dataHex.length; i += 2) {
    bytes.push(parseInt(dataHex.slice(i, i + 2), 16));
  }
  return bytes;
}

export async function readPID(conn: OBD2Connection, pid: string): Promise<OBD2PIDResult | null> {
  const def = PID_DEFINITIONS[pid];
  if (!def) return null;

  try {
    const response = await sendCommand(conn, pid);
    if (response.includes('NO DATA') || response.includes('ERROR')) return null;

    const bytes = parseHexBytes(response);
    if (bytes.length === 0) return null;

    return {
      pid,
      name: def.name,
      value: def.parse(bytes),
      unit: def.unit,
      raw: response,
    };
  } catch {
    return null;
  }
}

export async function readAllPIDs(conn: OBD2Connection): Promise<OBD2PIDResult[]> {
  const results: OBD2PIDResult[] = [];
  // Read critical PIDs — keep it fast
  const pids = ['010C', '0105', '010D', '0104', '0111', '0106', '0107', '0114', '0115', '012F', '0142'];

  for (const pid of pids) {
    const result = await readPID(conn, pid);
    if (result) results.push(result);
  }
  return results;
}

// ─── DTC Reading ────────────────────────────────────────────────────────────

const DTC_PREFIX: Record<string, string> = {
  '0': 'P0', '1': 'P1', '2': 'P2', '3': 'P3',
  '4': 'C0', '5': 'C1', '6': 'C2', '7': 'C3',
  '8': 'B0', '9': 'B1', 'A': 'B2', 'B': 'B3',
  'C': 'U0', 'D': 'U1', 'E': 'U2', 'F': 'U3',
};

function parseDTCResponse(response: string, status: 'stored' | 'pending'): OBD2DTC[] {
  const clean = response.replace(/[\s\r\n]/g, '');
  const codes: OBD2DTC[] = [];

  // Skip mode byte (43 for stored, 47 for pending)
  let data = clean;
  if (data.startsWith('43') || data.startsWith('47')) {
    data = data.slice(2);
  }

  // Each DTC is 4 hex chars (2 bytes)
  for (let i = 0; i + 3 < data.length; i += 4) {
    const chunk = data.slice(i, i + 4);
    if (chunk === '0000') continue; // No code

    const firstChar = chunk[0].toUpperCase();
    const prefix = DTC_PREFIX[firstChar] || 'P0';
    const code = prefix + chunk.slice(1).toUpperCase();

    if (/^[BPCU]\d{4}$/.test(code)) {
      codes.push({ code, status });
    }
  }

  return codes;
}

export async function readDTCs(conn: OBD2Connection): Promise<OBD2DTC[]> {
  const codes: OBD2DTC[] = [];

  // Mode 03: Stored DTCs
  try {
    const stored = await sendCommand(conn, '03');
    if (!stored.includes('NO DATA')) {
      codes.push(...parseDTCResponse(stored, 'stored'));
    }
  } catch { /* ignore */ }

  // Mode 07: Pending DTCs
  try {
    const pending = await sendCommand(conn, '07');
    if (!pending.includes('NO DATA')) {
      codes.push(...parseDTCResponse(pending, 'pending'));
    }
  } catch { /* ignore */ }

  return codes;
}

// ─── Freeze Frame ───────────────────────────────────────────────────────────

export interface FreezeFrameData {
  dtc: string;
  coolantTemp?: number;
  rpm?: number;
  speed?: number;
  load?: number;
  fuelTrimShort?: number;
  fuelTrimLong?: number;
}

export async function readFreezeFrame(conn: OBD2Connection): Promise<FreezeFrameData | null> {
  try {
    // Mode 02: Freeze frame data
    const dtcResp = await sendCommand(conn, '0202');
    if (dtcResp.includes('NO DATA')) return null;

    const frame: FreezeFrameData = { dtc: 'unknown' };

    // Read individual freeze frame PIDs
    const coolant = await sendCommand(conn, '0205').catch(() => '');
    if (coolant && !coolant.includes('NO DATA')) {
      const bytes = parseHexBytes(coolant);
      if (bytes.length > 0) frame.coolantTemp = Math.round((bytes[0] - 40) * 9 / 5 + 32);
    }

    const rpm = await sendCommand(conn, '020C').catch(() => '');
    if (rpm && !rpm.includes('NO DATA')) {
      const bytes = parseHexBytes(rpm);
      if (bytes.length >= 2) frame.rpm = Math.round((bytes[0] * 256 + bytes[1]) / 4);
    }

    const speed = await sendCommand(conn, '020D').catch(() => '');
    if (speed && !speed.includes('NO DATA')) {
      const bytes = parseHexBytes(speed);
      if (bytes.length > 0) frame.speed = Math.round(bytes[0] * 0.621371);
    }

    return frame;
  } catch {
    return null;
  }
}

export const SUPPORTED_PIDS = Object.entries(PID_DEFINITIONS).map(([pid, def]) => ({
  pid,
  ...def,
}));
