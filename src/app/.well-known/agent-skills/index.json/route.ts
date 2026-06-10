import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

/**
 * Agent Skills Discovery Index per RFC v0.2.0.
 * Exposes the automotive skills available to AI agents.
 */
export async function GET() {
  const baseUrl = 'https://alloemmanuals.com';

  const skills = [
    {
      name: 'lookup_repair_guide',
      type: 'api',
      description:
        'Retrieve a vehicle-specific repair guide with OEM procedures, torque specs, tools, and parts for any year/make/model/task.',
      url: `${baseUrl}/api/v1/repair`,
      sha256: digest(
        'lookup_repair_guide:vehicle-specific OEM repair guide retrieval'
      ),
    },
    {
      name: 'diagnose_dtc_code',
      type: 'api',
      description:
        'Look up a DTC code (e.g., P0420) and get the factory diagnostic flowchart, probable causes, and repair steps.',
      url: `${baseUrl}/api/graph/dtc`,
      sha256: digest('diagnose_dtc_code:factory DTC flowchart lookup'),
    },
    {
      name: 'find_wiring_diagram',
      type: 'api',
      description:
        'Find factory wiring diagrams and electrical schematics for a specific year, make, model, and system.',
      url: `${baseUrl}/api/wiring-selector`,
      sha256: digest('find_wiring_diagram:OEM wiring diagram selector'),
    },
    {
      name: 'get_vehicle_specs',
      type: 'api',
      description:
        'Get OEM specifications for a vehicle: torque specs, fluid capacities, spark plugs, belts, tires, battery.',
      url: `${baseUrl}/tools`,
      sha256: digest('get_vehicle_specs:OEM specification lookup'),
    },
    {
      name: 'purchase_premium_repair_data',
      type: 'payment',
      description:
        'Purchase structured premium factory repair data via x402 (Solana USDC). Returns torque specs, capacities, and OEM part numbers.',
      url: `${baseUrl}/api/premium-repair-data`,
      sha256: digest(
        'purchase_premium_repair_data:x402 payment-gated structured repair data'
      ),
    },
  ];

  return NextResponse.json(
    {
      $schema:
        'https://github.com/cloudflare/agent-skills-discovery-rcf/blob/main/schema/v0.2.0.json',
      skills,
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

function digest(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}
