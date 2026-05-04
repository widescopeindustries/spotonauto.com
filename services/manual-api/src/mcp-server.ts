#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  searchManuals,
  getSectionByPath,
  listMakes,
  listModels,
  getDtcSections,
  getHealth,
} from './db.js';

const server = new McpServer(
  {
    name: 'lemon-manuals-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
    instructions:
      'lemon-manuals-mcp connects your AI assistant to the LEMON Manuals database of car service manuals. ' +
      'Use search_manuals to find repair procedures, diagnostic steps, torque specs, and wiring diagrams. ' +
      'Use get_manual_section to read the full content of a specific manual section by its path. ' +
      'Use list_makes and list_models to discover what vehicles are covered. ' +
      'Use get_dtc_sections to find diagnostic trouble code information.',
  }
);

// ─── Tool: search_manuals ────────────────────────────────────────────────────

server.registerTool(
  'search_manuals',
  {
    title: 'Search Service Manuals',
    description:
      'Search the service manual database by vehicle (make, year, model) and/or a free-text query. ' +
      'Returns matching manual sections with titles, content previews, and source information.',
    inputSchema: {
      make: z.string().optional().describe('Vehicle make, e.g. "Honda"'),
      year: z.number().int().min(1960).max(2025).optional().describe('Vehicle model year'),
      model: z.string().optional().describe('Vehicle model, e.g. "Civic"'),
      query: z.string().optional().describe('Free-text search query, e.g. "brake rotor replacement"'),
      limit: z.number().int().min(1).max(100).optional().describe('Maximum results to return (default 20, max 100)'),
    },
  },
  async ({ make, year, model, query, limit }) => {
    const results = await searchManuals({ make, year, model, query, limit });
    return {
      content: [
        {
          type: 'text',
          text:
            results.length === 0
              ? 'No manual sections found matching your criteria.'
              : results
                  .map(
                    (r, i) =>
                      `${i + 1}. ${r.sectionTitle}\n   Vehicle: ${r.year} ${r.make} ${r.model}\n   Source: ${r.source}\n   Path: ${r.path}\n   Preview: ${r.contentPreview.slice(0, 280)}${r.contentPreview.length > 280 ? '…' : ''}`
                  )
                  .join('\n\n'),
        },
      ],
    };
  }
);

// ─── Tool: get_manual_section ────────────────────────────────────────────────

server.registerTool(
  'get_manual_section',
  {
    title: 'Get Manual Section',
    description:
      'Retrieve the full content of a specific manual section by its unique path. ' +
      'Use this after search_manuals to read the complete procedure or diagram.',
    inputSchema: {
      path: z.string().min(1).describe('The exact path of the manual section, e.g. "/lemon/honda/2013/civic/brake/rotor-replacement"'),
    },
  },
  async ({ path }) => {
    const section = await getSectionByPath(path);
    if (!section) {
      return {
        content: [{ type: 'text', text: `No manual section found for path: ${path}` }],
        isError: true,
      };
    }
    return {
      content: [
        {
          type: 'text',
          text:
            `# ${section.sectionTitle}\n` +
            `Vehicle: ${section.year} ${section.make} ${section.model}\n` +
            `Source: ${section.source}\n` +
            `Path: ${section.path}\n\n` +
            `${section.contentFull || section.contentPreview || 'No content available.'}`,
        },
      ],
    };
  }
);

// ─── Tool: list_makes ────────────────────────────────────────────────────────

server.registerTool(
  'list_makes',
  {
    title: 'List Available Makes',
    description:
      'List all vehicle makes covered in the manual database, along with the years available for each make.',
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
              ? 'No makes found in the database.'
              : makes
                  .map((m) => `- ${m.name}: ${m.years.length} years (${m.years.slice(0, 5).join(', ')}${m.years.length > 5 ? ', …' : ''})`)
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
    description:
      'List all models available for a specific make and year. Use this to discover exact model names before searching.',
    inputSchema: {
      make: z.string().min(1).describe('Vehicle make, e.g. "Honda"'),
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
              : `Models for ${make} ${year}:\n` + models.map((m) => `- ${m.name}`).join('\n'),
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
      'Find manual sections related to a specific diagnostic trouble code (DTC). ' +
      'Optionally filter by make and year.',
    inputSchema: {
      code: z.string().min(3).describe('DTC code, e.g. "P0420" or "B1234"'),
      make: z.string().optional().describe('Vehicle make to filter by'),
      year: z.number().int().optional().describe('Vehicle year to filter by'),
    },
  },
  async ({ code, make, year }) => {
    const results = await getDtcSections(code, make, year);
    return {
      content: [
        {
          type: 'text',
          text:
            results.length === 0
              ? `No DTC sections found for ${code}${make ? ` on ${make}` : ''}${year ? ` ${year}` : ''}.`
              : results
                  .map(
                    (r, i) =>
                      `${i + 1}. ${r.sectionTitle}\n   Vehicle: ${r.year} ${r.make} ${r.model}\n   Source: ${r.source}\n   Path: ${r.path}\n   Preview: ${r.contentPreview.slice(0, 280)}${r.contentPreview.length > 280 ? '…' : ''}`
                  )
                  .join('\n\n'),
        },
      ],
    };
  }
);

// ─── Tool: health_check ──────────────────────────────────────────────────────

server.registerTool(
  'health_check',
  {
    title: 'Health Check',
    description: 'Check the health and coverage statistics of the manual database.',
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
  // Log to stderr so it doesn't interfere with stdio JSON-RPC
  console.error('lemon-manuals-mcp server running on stdio');
}

main().catch((err) => {
  console.error('Fatal error starting MCP server:', err);
  process.exit(1);
});
