/**
 * OBD-II Service using Web Serial API for ELM327 adapters
 */

export interface OBDData {
  dtcs: string[];
  rpm?: number;
  speed?: number;
  coolantTemp?: number;
  engineLoad?: number;
  fuelPressure?: number;
  intakeTemp?: number;
  maf?: number;
  throttle?: number;
  voltage?: number;
  vin?: string;
}

export interface DTCInfo {
  code: string;
  description: string;
  system: 'powertrain' | 'chassis' | 'body' | 'network';
}

// Common DTC descriptions
const DTC_DESCRIPTIONS: Record<string, string> = {
  'P0300': 'Random/Multiple Cylinder Misfire Detected',
  'P0301': 'Cylinder 1 Misfire Detected',
  'P0302': 'Cylinder 2 Misfire Detected',
  'P0303': 'Cylinder 3 Misfire Detected',
  'P0304': 'Cylinder 4 Misfire Detected',
  'P0171': 'System Too Lean (Bank 1)',
  'P0172': 'System Too Rich (Bank 1)',
  'P0174': 'System Too Lean (Bank 2)',
  'P0175': 'System Too Rich (Bank 2)',
  'P0420': 'Catalyst System Efficiency Below Threshold (Bank 1)',
  'P0430': 'Catalyst System Efficiency Below Threshold (Bank 2)',
  'P0440': 'Evaporative Emission Control System Malfunction',
  'P0442': 'Evaporative Emission Control System Leak Detected (Small Leak)',
  'P0455': 'Evaporative Emission Control System Leak Detected (Large Leak)',
  'P0500': 'Vehicle Speed Sensor Malfunction',
  'P0505': 'Idle Control System Malfunction',
  'P0128': 'Coolant Thermostat (Coolant Temp Below Thermostat Regulating Temp)',
  'P0131': 'O2 Sensor Circuit Low Voltage (Bank 1 Sensor 1)',
  'P0133': 'O2 Sensor Circuit Slow Response (Bank 1 Sensor 1)',
  'P0135': 'O2 Sensor Heater Circuit Malfunction (Bank 1 Sensor 1)',
  'P0141': 'O2 Sensor Heater Circuit Malfunction (Bank 1 Sensor 2)',
  'P0401': 'Exhaust Gas Recirculation Flow Insufficient Detected',
  'P0411': 'Secondary Air Injection System Incorrect Flow Detected',
  'P0446': 'Evaporative Emission Control System Vent Control Circuit Malfunction',
  'P0456': 'Evaporative Emission Control System Leak Detected (Very Small Leak)',
  'P0507': 'Idle Air Control System RPM Higher Than Expected',
};

class OBDService {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private isConnected = false;
  private buffer = '';

  /**
   * Check if Web Serial API is supported
   */
  isSupported(): boolean {
    return 'serial' in navigator;
  }

  /**
   * Connect to ELM327 adapter
   */
  async connect(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('Web Serial API not supported. Use Chrome or Edge.');
    }

    try {
      // Request port access - user will see a picker
      this.port = await navigator.serial.requestPort();

      // ELM327 typically uses 38400 baud, but some use 9600 or 115200
      await this.port.open({ baudRate: 38400 });

      this.reader = this.port.readable?.getReader() ?? null;
      this.writer = this.port.writable?.getWriter() ?? null;

      if (!this.reader || !this.writer) {
        throw new Error('Failed to get reader/writer');
      }

      // Initialize ELM327
      await this.initializeELM327();
      this.isConnected = true;
      return true;
    } catch (error: any) {
      console.error('OBD Connect Error:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Initialize ELM327 with AT commands
   */
  private async initializeELM327(): Promise<void> {
    // Reset
    await this.sendCommand('ATZ', 2000);
    // Turn off echo
    await this.sendCommand('ATE0');
    // Turn off line feeds
    await this.sendCommand('ATL0');
    // Set protocol to auto
    await this.sendCommand('ATSP0');
    // Turn off headers
    await this.sendCommand('ATH0');
    // Set timeout
    await this.sendCommand('ATAT1');
  }

  /**
   * Send command and get response
   */
  private async sendCommand(cmd: string, timeout = 1000): Promise<string> {
    if (!this.writer || !this.reader) {
      throw new Error('Not connected');
    }

    // Send command with carriage return
    const encoder = new TextEncoder();
    await this.writer.write(encoder.encode(cmd + '\r'));

    // Read response
    const response = await this.readResponse(timeout);
    return response;
  }

  /**
   * Read response from ELM327
   */
  private async readResponse(timeout = 1000): Promise<string> {
    if (!this.reader) throw new Error('No reader');

    const decoder = new TextDecoder('utf-8', { fatal: false });
    let response = '';
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const { value, done } = await Promise.race([
          this.reader.read(),
          new Promise<{ value: undefined; done: true }>((resolve) =>
            setTimeout(() => resolve({ value: undefined, done: true }), 100)
          ),
        ]);

        if (done || !value) continue;

        response += decoder.decode(value, { stream: true });

        // ELM327 ends responses with '>'
        if (response.includes('>')) {
          break;
        }
      } catch (e) {
        break;
      }
    }

    // Clean up response
    return response
      .replace(/\r/g, '')
      .replace(/\n/g, '')
      .replace(/>/g, '')
      .replace(/SEARCHING\.\.\./g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Read Diagnostic Trouble Codes
   */
  async readDTCs(): Promise<DTCInfo[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to OBD adapter');
    }

    const dtcs: DTCInfo[] = [];

    try {
      // Mode 03 - Read stored DTCs
      const response = await this.sendCommand('03', 3000);

      if (response.includes('NO DATA') || response.includes('UNABLE')) {
        return dtcs; // No codes stored
      }

      // Parse DTC response
      const codes = this.parseDTCs(response);

      for (const code of codes) {
        dtcs.push({
          code,
          description: DTC_DESCRIPTIONS[code] || 'Unknown code - consult service manual',
          system: this.getDTCSystem(code),
        });
      }

      // Also try Mode 07 - Pending DTCs
      const pendingResponse = await this.sendCommand('07', 3000);
      if (!pendingResponse.includes('NO DATA')) {
        const pendingCodes = this.parseDTCs(pendingResponse);
        for (const code of pendingCodes) {
          if (!dtcs.find(d => d.code === code)) {
            dtcs.push({
              code: code + ' (Pending)',
              description: DTC_DESCRIPTIONS[code] || 'Pending code - issue detected but not confirmed',
              system: this.getDTCSystem(code),
            });
          }
        }
      }
    } catch (error) {
      console.error('Error reading DTCs:', error);
    }

    return dtcs;
  }

  /**
   * Parse DTC bytes into code strings
   */
  private parseDTCs(response: string): string[] {
    const codes: string[] = [];

    // Remove mode byte and spaces
    const hex = response.replace(/43|47/g, '').replace(/\s/g, '');

    // Each DTC is 4 hex characters (2 bytes)
    for (let i = 0; i < hex.length; i += 4) {
      const dtcHex = hex.substring(i, i + 4);
      if (dtcHex.length < 4 || dtcHex === '0000') continue;

      const code = this.decodeDTC(dtcHex);
      if (code) codes.push(code);
    }

    return codes;
  }

  /**
   * Decode 2-byte DTC to standard format (P0123, etc)
   */
  private decodeDTC(hex: string): string | null {
    if (hex.length !== 4) return null;

    const firstChar = parseInt(hex[0], 16);
    const prefix = ['P', 'C', 'B', 'U'][firstChar >> 2];
    const secondDigit = firstChar & 0x03;

    return `${prefix}${secondDigit}${hex.substring(1)}`;
  }

  /**
   * Get DTC system type
   */
  private getDTCSystem(code: string): 'powertrain' | 'chassis' | 'body' | 'network' {
    const prefix = code[0];
    switch (prefix) {
      case 'P': return 'powertrain';
      case 'C': return 'chassis';
      case 'B': return 'body';
      case 'U': return 'network';
      default: return 'powertrain';
    }
  }

  /**
   * Read live sensor data
   */
  async readLiveData(): Promise<Partial<OBDData>> {
    if (!this.isConnected) {
      throw new Error('Not connected');
    }

    const data: Partial<OBDData> = {};

    try {
      // RPM (PID 0C)
      const rpmResponse = await this.sendCommand('010C');
      if (!rpmResponse.includes('NO DATA')) {
        const rpmHex = rpmResponse.replace(/41 0C/i, '').trim();
        const bytes = rpmHex.split(' ');
        if (bytes.length >= 2) {
          data.rpm = (parseInt(bytes[0], 16) * 256 + parseInt(bytes[1], 16)) / 4;
        }
      }

      // Vehicle Speed (PID 0D)
      const speedResponse = await this.sendCommand('010D');
      if (!speedResponse.includes('NO DATA')) {
        const speedHex = speedResponse.replace(/41 0D/i, '').trim();
        data.speed = parseInt(speedHex, 16); // km/h
      }

      // Coolant Temp (PID 05)
      const coolantResponse = await this.sendCommand('0105');
      if (!coolantResponse.includes('NO DATA')) {
        const coolantHex = coolantResponse.replace(/41 05/i, '').trim();
        data.coolantTemp = parseInt(coolantHex, 16) - 40; // Celsius
      }

      // Engine Load (PID 04)
      const loadResponse = await this.sendCommand('0104');
      if (!loadResponse.includes('NO DATA')) {
        const loadHex = loadResponse.replace(/41 04/i, '').trim();
        data.engineLoad = (parseInt(loadHex, 16) * 100) / 255; // Percentage
      }

      // Throttle Position (PID 11)
      const throttleResponse = await this.sendCommand('0111');
      if (!throttleResponse.includes('NO DATA')) {
        const throttleHex = throttleResponse.replace(/41 11/i, '').trim();
        data.throttle = (parseInt(throttleHex, 16) * 100) / 255; // Percentage
      }

      // Intake Air Temp (PID 0F)
      const intakeResponse = await this.sendCommand('010F');
      if (!intakeResponse.includes('NO DATA')) {
        const intakeHex = intakeResponse.replace(/41 0F/i, '').trim();
        data.intakeTemp = parseInt(intakeHex, 16) - 40; // Celsius
      }

    } catch (error) {
      console.error('Error reading live data:', error);
    }

    return data;
  }

  /**
   * Read VIN
   */
  async readVIN(): Promise<string | null> {
    if (!this.isConnected) return null;

    try {
      const response = await this.sendCommand('0902', 5000);
      if (response.includes('NO DATA')) return null;

      // Parse VIN from response (complex multi-frame response)
      const hex = response.replace(/49 02 \d+/g, '').replace(/\s/g, '');
      let vin = '';
      for (let i = 0; i < hex.length; i += 2) {
        const charCode = parseInt(hex.substring(i, i + 2), 16);
        if (charCode >= 32 && charCode <= 126) {
          vin += String.fromCharCode(charCode);
        }
      }
      return vin.length === 17 ? vin : null;
    } catch {
      return null;
    }
  }

  /**
   * Clear DTCs (use with caution!)
   */
  async clearDTCs(): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      const response = await this.sendCommand('04', 3000);
      return !response.includes('ERROR');
    } catch {
      return false;
    }
  }

  /**
   * Disconnect from adapter
   */
  async disconnect(): Promise<void> {
    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader.releaseLock();
        this.reader = null;
      }
      if (this.writer) {
        await this.writer.close();
        this.writer = null;
      }
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
    this.isConnected = false;
  }

  /**
   * Check connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
export const obdService = new OBDService();
