'use client';

import { useEffect } from 'react';

/**
 * WebMCP — Expose site tools to AI agents via the browser.
 * https://webmachinelearning.github.io/webmcp/
 */
export default function WebMCP() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('modelContext' in navigator)) return;

    const nc = navigator as any;

    try {
      nc.modelContext.provideContext({
        name: 'alloemmanuals',
        tools: [
          {
            name: 'getRepairGuide',
            description: 'Get a vehicle-specific repair guide for a specific year, make, model, and repair task.',
            inputSchema: {
              type: 'object',
              properties: {
                year: { type: 'integer', description: 'Vehicle model year (e.g. 2012)' },
                make: { type: 'string', description: 'Vehicle make slug (e.g. toyota)' },
                model: { type: 'string', description: 'Vehicle model slug (e.g. camry)' },
                task: { type: 'string', description: 'Repair task slug (e.g. oil-change)' },
              },
              required: ['year', 'make', 'model', 'task'],
            },
            execute: async (input: any) => {
              const url = `https://alloemmanuals.com/api/v1/repair?year=${input.year}&make=${input.make}&model=${input.model}&task=${input.task}`;
              const res = await fetch(url);
              return res.json();
            },
          },
          {
            name: 'getDTCInfo',
            description: 'Look up diagnostic trouble code (DTC) information.',
            inputSchema: {
              type: 'object',
              properties: {
                code: { type: 'string', description: 'OBD-II DTC code (e.g. P0420)' },
              },
              required: ['code'],
            },
            execute: async (input: any) => {
              const url = `https://alloemmanuals.com/api/graph/dtc/${encodeURIComponent(input.code)}`;
              const res = await fetch(url);
              return res.json();
            },
          },
          {
            name: 'getVehicleHub',
            description: 'Get the vehicle hub page with all available content for a specific year, make, and model.',
            inputSchema: {
              type: 'object',
              properties: {
                year: { type: 'integer', description: 'Vehicle model year' },
                make: { type: 'string', description: 'Vehicle make slug' },
                model: { type: 'string', description: 'Vehicle model slug' },
              },
              required: ['year', 'make', 'model'],
            },
            execute: async (input: any) => {
              const url = `https://alloemmanuals.com/vehicles/${input.year}/${input.make}/${input.model}`;
              const res = await fetch(url, { headers: { Accept: 'text/markdown' } });
              return { url, content: await res.text() };
            },
          },
        ],
      });
    } catch (e) {
      // WebMCP not supported in this browser
    }
  }, []);

  return null;
}
