#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  searchManuals,
  searchManualsRanked,
  getSectionByPath,
  listMakes,
  listModels,
  listVariants,
  listSystems,
  getDtcSections,
  getWiringDiagramSections,
  getHealth,
} from './db.js';
import { cleanManualContent, formatSectionForMcp } from './contentCleaner.js';

const server = new McpServer(
  {
    name: 'lemon-manuals-mcp',
    version: '1.0.0',
  },
  {
    capabilities: { tools: {} },
    instructions:
      'lemon-manuals-mcp connects your AI assistant to the LEMON Manuals database of car service manuals.\n\n' +
      'Best practices:\n' +
      '1. Use discover_vehicle to find exact model variants before deep searches.\n' +
      '2. Use search_manuals for general lookups; it supports partial model names (e.g. "Civic" matches "Civic EX-L").\n' +
      '3. Use get_manual_section to read the full content of a specific section by path.\n' +
      '4. Use get_dtc_sections for diagnostic trouble code procedures.\n' +
      '5. Use get_wiring_diagrams to find wiring diagrams and connector pinouts.\n' +
      '6. Use list_systems to see what repair categories are available for a vehicle.',
  }
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, '') + '…';
}

function formatSectionList(sections: Array<{ path: string; make: string; year: number; model: string; sectionTitle: string; source: string; contentPreview: string; relevance?: number }>): string {
  if (sections.length === 0) return 'No manual sections found matching your criteria.';
  return sections
    .map((r, i) => {
      const rel = typeof r.relevance === 'number' ? ` [relevance: ${r.relevance}]` : '';
      return `${i + 1}. ${r.sectionTitle}${rel}\n   Vehicle: ${r.year} ${r.make} ${r.model}\n   Source: ${r.source}\n   Path: ${r.path}\n   Preview: ${truncate(r.contentPreview, 260)}`;
    })
    .join('\n\n');
}

// ─── Tool: discover_vehicle ──────────────────────────────────────────────────

server.registerTool(
  'discover_vehicle',
  {
    title: 'Discover Vehicle Variants',
    description:
      'Given a make and year, list all exact model variants and trims in the database. ' +
      'Use this before searching if you are unsure of the exact model name.',
    inputSchema: {
      make: z.string().min(1).describe('Vehicle make, e.g. "Honda"'),
      year: z.number().int().min(1960).max(2025).describe('Vehicle model year'),
    },
  },
  async ({ make, year }) => {
    const variants = await listVariants({ make, year });
    if (variants.length === 0) {
      return { content: [{ type: 'text', text: `No models found for ${make} ${year}.` }] };
    }

    let text = `Variants for ${make} ${year}:\n\n`;
    for (const group of variants) {
      text += `## ${group.baseModel}\n`;
      for (const v of group.variants) {
        text += `- ${v.name}\n`;
      }
      text += '\n';
    }
    return { content: [{ type: 'text', text: text.trim() }] };
  }
);

// ─── Tool: search_manuals ────────────────────────────────────────────────────

server.registerTool(
  'search_manuals',
  {
    title: 'Search Service Manuals',
    description:
      'Search the service manual database by vehicle and/or free-text query. ' +
      'Model matching is fuzzy — "Civic" will match "Civic EX-L". ' +
      'Returns matching manual sections with previews and paths.',
    inputSchema: {
      make: z.string().optional().describe('Vehicle make, e.g. "Honda"'),
      year: z.number().int().min(1960).max(2025).optional().describe('Vehicle model year'),
      model: z.string().optional().describe('Vehicle model (partial match OK), e.g. "Civic" or "F-150"'),
      query: z.string().optional().describe('Free-text search query, e.g. "brake rotor replacement"'),
      system: z.string().optional().describe('Filter by system/category keyword in the path, e.g. "Brakes" or "Engine"'),
      limit: z.number().int().min(1).max(100).optional().describe('Maximum results (default 20, max 100)'),
    },
  },
  async ({ make, year, model, query, system, limit }) => {
    const results = await searchManuals({ make, year, model, query, system, limit });
    return {
      content: [{ type: 'text', text: formatSectionList(results) }],
    };
  }
);

// ─── Tool: search_manuals_ranked ─────────────────────────────────────────────

server.registerTool(
  'search_manuals_ranked',
  {
    title: 'Ranked Search Service Manuals',
    description:
      'Search with relevance scoring. Best for finding the most applicable procedure ' +
      'when you have a specific symptom or task description.',
    inputSchema: {
      make: z.string().optional().describe('Vehicle make'),
      year: z.number().int().min(1960).max(2025).optional().describe('Vehicle model year'),
      model: z.string().optional().describe('Vehicle model (partial match OK)'),
      query: z.string().min(1).describe('Free-text search query'),
      limit: z.number().int().min(1).max(100).optional().describe('Maximum results (default 20, max 100)'),
    },
  },
  async ({ make, year, model, query, limit }) => {
    const results = await searchManualsRanked({ make, year, model, query, limit });
    return {
      content: [{ type: 'text', text: formatSectionList(results) }],
    };
  }
);

// ─── Tool: get_manual_section ────────────────────────────────────────────────

server.registerTool(
  'get_manual_section',
  {
    title: 'Get Manual Section',
    description:
      'Retrieve the full, cleaned content of a specific manual section by its path. ' +
      'Use after search_manuals when you need the complete procedure, torque specs, or diagram references.',
    inputSchema: {
      path: z.string().min(1).describe('Exact section path from search results'),
      include_images: z.boolean().optional().describe('Include image URLs referenced in the section (default false)'),
    },
  },
  async ({ path, include_images }) => {
    const section = await getSectionByPath(path);
    if (!section) {
      return {
        content: [{ type: 'text', text: `No manual section found for path: ${path}` }],
        isError: true,
      };
    }
    const text = formatSectionForMcp(section, { includeImages: include_images ?? false });
    return { content: [{ type: 'text', text }] };
  }
);

// ─── Tool: list_makes ────────────────────────────────────────────────────────

server.registerTool(
  'list_makes',
  {
    title: 'List Available Makes',
    description: 'List all vehicle makes covered in the manual database with available year ranges.',
    inputSchema: {},
  },
  async () => {
    const makes = await listMakes();
    return {
      content: [
        {
          type: 'text',
          text:
            makes.length === 0
              ? 'No makes found.'
              : makes
                  .map((m) => `- ${m.name}: ${m.years.length} years (${m.years.slice(0, 6).join(', ')}${m.years.length > 6 ? ', …' : ''})`)
                  .join('\n'),
        },
      ],
    };
  }
);

// ─── Tool: list_models ───────────────────────────────────────────────────────

server.registerTool(
  'list_models',
  {
    title: 'List Models for Make/Year',
    description: 'List every exact model variant for a specific make and year.',
    inputSchema: {
      make: z.string().min(1).describe('Vehicle make'),
      year: z.number().int().min(1960).max(2025).describe('Vehicle model year'),
    },
  },
  async ({ make, year }) => {
    const models = await listModels({ make, year });
    return {
      content: [
        {
          type: 'text',
          text:
            models.length === 0
              ? `No models found for ${make} ${year}.`
              : `${make} ${year} models (${models.length}):\n` + models.map((m) => `- ${m.name}`).join('\n'),
        },
      ],
    };
  }
);

// ─── Tool: list_systems ──────────────────────────────────────────────────────

server.registerTool(
  'list_systems',
  {
    title: 'List Repair Systems',
    description:
      'List the repair system categories available for a given vehicle (e.g. Brakes, Engine, Electrical). ' +
      'Use this to narrow down searches before calling search_manuals.',
    inputSchema: {
      make: z.string().optional().describe('Vehicle make'),
      year: z.number().int().min(1960).max(2025).optional().describe('Vehicle model year'),
      model: z.string().optional().describe('Vehicle model (partial match OK)'),
    },
  },
  async ({ make, year, model }) => {
    const systems = await listSystems({ make, year, model });
    if (systems.length === 0) {
      return { content: [{ type: 'text', text: 'No systems found for the given criteria.' }] };
    }
    return {
      content: [
        {
          type: 'text',
          text: `Systems (${systems.length}):\n` + systems.map((s) => `- ${s}`).join('\n'),
        },
      ],
    };
  }
);

// ─── Tool: get_dtc_sections ──────────────────────────────────────────────────

server.registerTool(
  'get_dtc_sections',
  {
    title: 'Get DTC Sections',
    description:
      'Find manual sections related to a diagnostic trouble code (DTC). ' +
      'Optionally filter by make and year. Returns diagnostic procedures, code definitions, and troubleshooting steps.',
    inputSchema: {
      code: z.string().min(3).describe('DTC code, e.g. "P0420" or "B1234"'),
      make: z.string().optional().describe('Vehicle make to filter by'),
      year: z.number().int().optional().describe('Vehicle year to filter by'),
      limit: z.number().int().min(1).max(50).optional().describe('Maximum results (default 20, max 50)'),
    },
  },
  async ({ code, make, year, limit }) => {
    const results = await getDtcSections(code, make, year);
    const sliced = results.slice(0, Math.min(limit ?? 20, 50));
    return {
      content: [{ type: 'text', text: formatSectionList(sliced) }],
    };
  }
);

// ─── Tool: get_wiring_diagrams ───────────────────────────────────────────────

server.registerTool(
  'get_wiring_diagrams',
  {
    title: 'Get Wiring Diagrams',
    description:
      'Find wiring diagram sections and connector pinouts for a vehicle. ' +
      'Optionally filter by electrical system keyword (e.g. "starter", "headlight", "ABS").',
    inputSchema: {
      make: z.string().optional().describe('Vehicle make'),
      year: z.number().int().optional().describe('Vehicle model year'),
      model: z.string().optional().describe('Vehicle model (partial match OK)'),
      system: z.string().optional().describe('Electrical system keyword, e.g. "starter", "headlight", "HVAC"'),
      limit: z.number().int().min(1).max(50).optional().describe('Maximum results (default 15, max 50)'),
    },
  },
  async ({ make, year, model, system, limit }) => {
    const results = await getWiringDiagramSections({ make, year, model, system, limit: limit ?? 15 });
    return {
      content: [{ type: 'text', text: formatSectionList(results) }],
    };
  }
);

// ─── Tool: health_check ──────────────────────────────────────────────────────

server.registerTool(
  'health_check',
  {
    title: 'Health Check',
    description: 'Check database connectivity and coverage statistics.',
    inputSchema: {},
  },
  async () => {
    const health = await getHealth();
    return {
      content: [
        {
          type: 'text',
          text:
            `Database health:\n` +
            `- Total sections: ${health.sections.toLocaleString()}\n` +
            `- Makes covered: ${health.makes}\n` +
            `- Years covered: ${health.years}\n` +
            `- Make/year combinations: ${health.makeYears.toLocaleString()}\n` +
            `- Newest entry: ${health.newestEntry || 'unknown'}`,
        },
      ],
    };
  }
);

// ─── Start ───────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('lemon-manuals-mcp server running on stdio');
}

main().catch((err) => {
  console.error('Fatal error starting MCP server:', err);
  process.exit(1);
});
