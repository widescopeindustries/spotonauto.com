/**
 * Map DTC codes / affected systems to high-intent Amazon affiliate part queries.
 * Used by /codes/[code] to surface "Common parts for this code" cards.
 */

export interface CodePartRecommendation {
  query: string;
  label: string;
  category: 'part' | 'tool' | 'consumable';
  subLabel?: string;
}

const SYSTEM_PARTS: Record<string, CodePartRecommendation[]> = {
  Engine: [
    { query: 'oxygen sensor', label: 'Oxygen Sensor', category: 'part' },
    { query: 'spark plugs', label: 'Spark Plugs', category: 'part' },
    { query: 'ignition coils', label: 'Ignition Coils', category: 'part' },
    { query: 'mass air flow sensor', label: 'Mass Air Flow Sensor', category: 'part' },
    { query: 'fuel injectors', label: 'Fuel Injectors', category: 'part' },
    { query: 'engine oil', label: 'Engine Oil', category: 'consumable' },
  ],
  Transmission: [
    { query: 'transmission fluid', label: 'Transmission Fluid', category: 'consumable' },
    { query: 'transmission filter', label: 'Transmission Filter', category: 'part' },
    { query: 'shift solenoid', label: 'Shift Solenoid', category: 'part' },
    { query: 'torque converter', label: 'Torque Converter', category: 'part' },
  ],
  Emissions: [
    { query: 'oxygen sensor', label: 'Oxygen Sensor', category: 'part' },
    { query: 'catalytic converter', label: 'Catalytic Converter', category: 'part' },
    { query: 'EVAP purge valve', label: 'EVAP Purge Valve', category: 'part' },
    { query: 'gas cap', label: 'Gas Cap', category: 'part' },
  ],
  Brakes: [
    { query: 'brake pads', label: 'Brake Pads', category: 'part' },
    { query: 'brake rotors', label: 'Brake Rotors', category: 'part' },
    { query: 'ABS wheel speed sensor', label: 'ABS Sensor', category: 'part' },
    { query: 'brake fluid', label: 'Brake Fluid', category: 'consumable' },
  ],
  'ABS/TCS': [
    { query: 'ABS wheel speed sensor', label: 'ABS Sensor', category: 'part' },
    { query: 'brake pads', label: 'Brake Pads', category: 'part' },
    { query: 'brake rotors', label: 'Brake Rotors', category: 'part' },
  ],
  Cooling: [
    { query: 'thermostat', label: 'Thermostat', category: 'part' },
    { query: 'coolant', label: 'Engine Coolant', category: 'consumable' },
    { query: 'radiator', label: 'Radiator', category: 'part' },
    { query: 'water pump', label: 'Water Pump', category: 'part' },
    { query: 'coolant temperature sensor', label: 'Coolant Temp Sensor', category: 'part' },
  ],
  Electrical: [
    { query: 'battery', label: 'Car Battery', category: 'part' },
    { query: 'alternator', label: 'Alternator', category: 'part' },
    { query: 'starter motor', label: 'Starter Motor', category: 'part' },
    { query: 'multimeter automotive', label: 'Digital Multimeter', category: 'tool' },
    { query: 'automotive fuses assortment', label: 'Assorted Fuses', category: 'part' },
  ],
  'Fuel and Air Metering': [
    { query: 'mass air flow sensor', label: 'Mass Air Flow Sensor', category: 'part' },
    { query: 'fuel injectors', label: 'Fuel Injectors', category: 'part' },
    { query: 'fuel pump', label: 'Fuel Pump', category: 'part' },
    { query: 'air filter', label: 'Air Filter', category: 'part' },
  ],
  'Auxiliary Emissions Controls': [
    { query: 'EVAP purge valve', label: 'EVAP Purge Valve', category: 'part' },
    { query: 'gas cap', label: 'Gas Cap', category: 'part' },
    { query: 'charcoal canister', label: 'Charcoal Canister', category: 'part' },
  ],
  'Vehicle Speed/Idle Control': [
    { query: 'idle air control valve', label: 'Idle Air Control Valve', category: 'part' },
    { query: 'throttle body', label: 'Throttle Body', category: 'part' },
    { query: 'MAF sensor cleaner', label: 'MAF Sensor Cleaner', category: 'consumable' },
  ],
  'Computer and Auxiliary Outputs': [
    { query: 'multimeter automotive', label: 'Digital Multimeter', category: 'tool' },
    { query: 'OBD2 scanner', label: 'OBD2 Scanner', category: 'tool' },
    { query: 'automotive fuses assortment', label: 'Assorted Fuses', category: 'part' },
  ],
  Body: [
    { query: 'door lock actuator', label: 'Door Lock Actuator', category: 'part' },
    { query: 'window regulator', label: 'Window Regulator', category: 'part' },
    { query: 'airbag clock spring', label: 'Clock Spring', category: 'part' },
  ],
  Chassis: [
    { query: 'wheel bearing', label: 'Wheel Bearing', category: 'part' },
    { query: 'ABS wheel speed sensor', label: 'ABS Sensor', category: 'part' },
    { query: 'suspension control arm', label: 'Control Arm', category: 'part' },
  ],
  Network: [
    { query: 'OBD2 scanner', label: 'OBD2 Scanner', category: 'tool' },
    { query: 'multimeter automotive', label: 'Digital Multimeter', category: 'tool' },
  ],
  HVAC: [
    { query: 'cabin air filter', label: 'Cabin Air Filter', category: 'part' },
    { query: 'blower motor resistor', label: 'Blower Resistor', category: 'part' },
    { query: 'AC compressor', label: 'AC Compressor', category: 'part' },
  ],
  Lighting: [
    { query: 'headlight bulb', label: 'Headlight Bulbs', category: 'part' },
    { query: 'tail light bulb', label: 'Tail Light Bulbs', category: 'part' },
    { query: 'headlight assembly', label: 'Headlight Assembly', category: 'part' },
  ],
};

// Fallback heuristic based on code text
const KEYWORD_PARTS: Array<{ pattern: RegExp; recs: CodePartRecommendation[] }> = [
  {
    pattern: /\b(o2|oxygen|lambda|fuel trim|catalyst|cat|emission|evap|purge|egr)\b/i,
    recs: SYSTEM_PARTS.Emissions,
  },
  {
    pattern: /\b(misfire|spark|ignition|coil|fuel injector|fuel pump|air flow|maf|map|throttle)\b/i,
    recs: SYSTEM_PARTS.Engine,
  },
  {
    pattern: /\b(transmission|transaxle|torque converter|shift|clutch)\b/i,
    recs: SYSTEM_PARTS.Transmission,
  },
  {
    pattern: /\b(ABS|brake|wheel speed|traction|stability)\b/i,
    recs: SYSTEM_PARTS.Brakes,
  },
  {
    pattern: /\b(coolant|thermostat|radiator|water pump|overheat|temperature)\b/i,
    recs: SYSTEM_PARTS.Cooling,
  },
  {
    pattern: /\b(battery|alternator|starter|charging|voltage|electrical)\b/i,
    recs: SYSTEM_PARTS.Electrical,
  },
  {
    pattern: /\b(HVAC|AC|heater|blower|cabin|climate|compressor)\b/i,
    recs: SYSTEM_PARTS.HVAC,
  },
  {
    pattern: /\b(airbag|SRS|seat belt|occupancy|clock spring)\b/i,
    recs: SYSTEM_PARTS.Body,
  },
];

export function getPartsForCode(
  code: string,
  title: string,
  affectedSystem: string,
  commonFix: string,
  limit = 6,
): CodePartRecommendation[] {
  const searchText = `${code} ${title} ${affectedSystem} ${commonFix}`;

  // 1. Direct system match
  let recs = SYSTEM_PARTS[affectedSystem];

  // 2. Keyword fallback
  if (!recs) {
    for (const kp of KEYWORD_PARTS) {
      if (kp.pattern.test(searchText)) {
        recs = kp.recs;
        break;
      }
    }
  }

  // 3. Generic diagnostic tools fallback
  if (!recs) {
    recs = [
      { query: 'OBD2 scanner', label: 'OBD2 Scanner', category: 'tool' },
      { query: 'multimeter automotive', label: 'Digital Multimeter', category: 'tool' },
      { query: 'automotive fuses assortment', label: 'Assorted Fuses', category: 'part' },
    ];
  }

  // Deduplicate by label, cap at limit
  const seen = new Set<string>();
  const out: CodePartRecommendation[] = [];
  for (const r of recs) {
    if (seen.has(r.label)) continue;
    seen.add(r.label);
    out.push(r);
    if (out.length >= limit) break;
  }
  return out;
}
