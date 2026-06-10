import { NextResponse } from 'next/server';

/**
 * MCP Server Card per SEP-1649.
 * Advertises the corpus MCP server deployed on the VPS.
 */
export async function GET() {
  const serverCard = {
    schemaVersion: '1.0',
    serverInfo: {
      name: 'alloemmanuals-corpus-mcp',
      version: '1.0.0',
      description:
        'MCP server for querying the CHARM + LEMON factory service manual corpus (300K+ vehicles). Provides OEM specs, torque values, fluid capacities, wiring diagrams, DTC flowcharts, and repair procedures.',
      url: 'https://alloemmanuals.com',
    },
    transport: {
      type: 'stdio',
      command: 'ssh',
      args: [
        'root@116.202.210.109',
        '/opt/corpus-mcp/bin/python3',
        '/root/spotonauto.com/scripts/mcp/manual_mcp.py',
      ],
      documentation: 'https://alloemmanuals.com/',
    },
    capabilities: {
      tools: [
        { name: 'find_pages', description: 'Find manual pages by vehicle + keyword' },
        { name: 'get_all_specs', description: 'Get all specifications for a vehicle' },
        { name: 'get_spark_plugs', description: 'Spark plug type, gap, torque' },
        { name: 'get_drive_belts', description: 'Drive belt routing and specs' },
        { name: 'get_fluids', description: 'Fluid capacities and types' },
        { name: 'get_tire_fitment', description: 'Tire sizes and pressures' },
      ],
      resources: false,
      prompts: false,
    },
    auth: {
      type: 'none',
      note: 'Direct SSH invocation for authorized clients. For agent access, use x402-gated API at /api/premium-repair-data.',
    },
  };

  return NextResponse.json(serverCard, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
