import { NextResponse } from 'next/server';

/**
 * OpenAPI 3.0 spec for Machine Payment Protocol (MPP) discovery.
 */
export async function GET() {
  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'AllOEMManuals API',
      description:
        'Factory service manual data for 300K+ vehicles. Repair guides, torque specs, fluid capacities, wiring diagrams, DTC codes, and diagnostic flowcharts.',
      version: '1.0.0',
      contact: {
        name: 'AllOEMManuals',
        url: 'https://alloemmanuals.com',
      },
      'x-payment-info': {
        protocol: 'x402',
        asset: 'USDC',
        network: 'solana',
        price: '$0.01',
      },
    },
    servers: [
      {
        url: 'https://alloemmanuals.com',
        description: 'Production server',
      },
    ],
    paths: {
      '/api/v1/repair': {
        get: {
          summary: 'Get vehicle-specific repair guide',
          description: 'Returns a repair guide for a specific year, make, model, and task.',
          parameters: [
            {
              name: 'year',
              in: 'query',
              required: true,
              schema: { type: 'integer', example: 2012 },
              description: 'Vehicle model year',
            },
            {
              name: 'make',
              in: 'query',
              required: true,
              schema: { type: 'string', example: 'toyota' },
              description: 'Vehicle make (slug)',
            },
            {
              name: 'model',
              in: 'query',
              required: true,
              schema: { type: 'string', example: 'camry' },
              description: 'Vehicle model (slug)',
            },
            {
              name: 'task',
              in: 'query',
              required: true,
              schema: { type: 'string', example: 'oil-change' },
              description: 'Repair task slug',
            },
          ],
          responses: {
            '200': {
              description: 'Repair guide data',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/RepairGuide' },
                },
              },
            },
            '404': {
              description: 'Repair guide not found for this vehicle/task',
            },
          },
        },
      },
      '/api/premium-repair-data': {
        'x-payment-info': [
          {
            protocol: 'x402',
            asset: 'USDC',
            network: 'solana',
            price: '$0.01',
          },
        ],
        get: {
          summary: 'Premium factory repair data (x402 paid)',
          description:
            'Structured OEM repair data including torque specs, fluid capacities, wiring diagrams, and part numbers. Requires x402 payment.',
          'x-payment-info': [
            {
              protocol: 'x402',
              asset: 'USDC',
              network: 'solana',
              price: '$0.01',
            },
          ],
          parameters: [
            {
              name: 'year',
              in: 'query',
              required: true,
              schema: { type: 'integer' },
            },
            {
              name: 'make',
              in: 'query',
              required: true,
              schema: { type: 'string' },
            },
            {
              name: 'model',
              in: 'query',
              required: true,
              schema: { type: 'string' },
            },
            {
              name: 'task',
              in: 'query',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Premium repair data',
            },
            '402': {
              description: 'Payment Required — x402 payment needed',
              headers: {
                'X-Payment-Required': {
                  schema: { type: 'string' },
                  description: 'x402 payment requirements',
                },
              },
            },
          },
        },
      },
      '/api/v1/dtc': {
        get: {
          summary: 'DTC code lookup',
          description: 'Look up diagnostic trouble code information.',
          parameters: [
            {
              name: 'code',
              in: 'query',
              required: true,
              schema: { type: 'string', example: 'P0420' },
              description: 'OBD-II DTC code',
            },
          ],
          responses: {
            '200': {
              description: 'DTC information',
            },
          },
        },
      },
    },
    components: {
      schemas: {
        RepairGuide: {
          type: 'object',
          properties: {
            year: { type: 'integer' },
            make: { type: 'string' },
            model: { type: 'string' },
            task: { type: 'string' },
            title: { type: 'string' },
            content: { type: 'string' },
            specifications: {
              type: 'object',
              additionalProperties: true,
            },
            parts: {
              type: 'array',
              items: { type: 'object' },
            },
            tools: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },
    },
  };

  return NextResponse.json(spec, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
