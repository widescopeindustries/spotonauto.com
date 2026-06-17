import { NextResponse } from 'next/server';

/**
 * OpenAPI 3.0 spec for AllOEMManuals API.
 * Includes x-payment-info for x402 + Stripe discovery.
 */
export async function GET() {
  const x402Payment = {
    protocol: 'x402',
    asset: 'USDC',
    network: 'solana-devnet',
    scheme: 'exact',
    price: '$0.01',
  };

  const stripePayment = {
    protocol: 'stripe',
    model: 'credits',
    price: '$0.01',
    per: 'page',
    info_url: 'https://alloemmanuals.com/for-ai',
    checkout_url: 'https://alloemmanuals.com/api/stripe/checkout',
    account_url: 'https://alloemmanuals.com/api/account',
  };

  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'AllOEMManuals API',
      description:
        'Factory service manual data for 300K+ vehicles (1960–2025). Repair guides, torque specs, fluid capacities, wiring diagrams, DTC codes, and diagnostic flowcharts. Two corpuses: CHARM (1982–2014, 24,935 vehicles, deeper content) and LEMON (1960s–2025, 279,988 vehicles, more variants). Every response is vehicle-specific.',
      version: '1.0.0',
      contact: {
        name: 'AllOEMManuals API Team',
        url: 'https://alloemmanuals.com/developers',
        email: 'api@alloemmanuals.com',
      },
      'x-payment-info': [x402Payment, stripePayment],
      'x-service-info': {
        categories: ['automotive', 'repair-data', 'diagnostics', 'OEM', 'factory-manual'],
      },
    },
    servers: [
      { url: 'https://alloemmanuals.com', description: 'Production' },
    ],
    security: [
      { ApiKeyAuth: [] },
      { x402: [] },
    ],
    tags: [
      { name: 'Repair', description: 'Vehicle-specific repair guides and specs' },
      { name: 'Premium', description: 'Payment-gated OEM excerpts and knowledge graph' },
      { name: 'Diagnostics', description: 'DTC codes and graph-based diagnosis' },
      { name: 'Training Feed', description: 'Clean markdown vehicle data for AI training and agent consumption' },
      { name: 'Payments', description: 'Stripe credit packs, webhooks, and account management' },
    ],
    paths: {
      '/api/v1/repair': {
        get: {
          tags: ['Repair'],
          summary: 'Get vehicle-specific repair guide',
          description:
            'Returns a complete repair guide for a specific year, make, model, and task. Includes tools, parts (with OEM numbers), torque specs, warnings, step-by-step instructions, OEM manual excerpts, and a knowledge graph of related components, DTCs, and wiring. Free tier: 100 req/day.',
          'x-payment-info': [],
          parameters: [
            {
              name: 'year',
              in: 'query',
              required: true,
              schema: { type: 'integer', minimum: 1960, maximum: 2025, example: 2013 },
              description: 'Vehicle model year',
            },
            {
              name: 'make',
              in: 'query',
              required: true,
              schema: { type: 'string', example: 'bmw' },
              description: 'Vehicle make slug (e.g. bmw, toyota, ford)',
            },
            {
              name: 'model',
              in: 'query',
              required: true,
              schema: { type: 'string', example: 'x3' },
              description: 'Vehicle model slug (e.g. x3, camry, f-150)',
            },
            {
              name: 'task',
              in: 'query',
              required: true,
              schema: { type: 'string', example: 'oil-change' },
              description:
                'Repair task slug. Options: oil-change, brake-pad-replacement, brake-rotor-replacement, alternator-replacement, starter-replacement, battery-replacement, spark-plug-replacement, radiator-replacement, thermostat-replacement, water-pump-replacement, serpentine-belt-replacement, cabin-air-filter-replacement, engine-air-filter-replacement, wiper-blade-replacement, headlight-bulb-replacement, taillight-bulb-replacement, transmission-fluid-change, differential-fluid-change, transfer-case-fluid-change, coolant-flush, fuel-filter-replacement, oxygen-sensor-replacement, wheel-bearing-replacement, strut-replacement, shock-absorber-replacement, control-arm-replacement, tie-rod-end-replacement, cv-axle-replacement, brake-caliper-replacement, brake-master-cylinder-replacement, power-steering-pump-replacement, rack-and-pinion-replacement, fuel-pump-replacement, ignition-coil-replacement, mass-airflow-sensor-replacement, throttle-body-cleaning, valve-cover-gasket-replacement, timing-belt-replacement, timing-chain-replacement',
            },
          ],
          responses: {
            '200': {
              description: 'Repair guide data',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/RepairGuideResponse' },
                },
              },
            },
            '400': {
              description: 'Missing required parameters',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '404': {
              description: 'Invalid vehicle or task combination',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '429': {
              description: 'Rate limit exceeded',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/premium-repair-data': {
        get: {
          tags: ['Premium'],
          summary: 'Premium factory repair data (x402 paid)',
          description:
            'Structured OEM repair data including full factory manual excerpts, knowledge graph relationships, generated repair profiles, and wiring diagram references. Paid via x402 (Solana devnet) or Stripe credits. This is the same dataset as /api/v1/repair with deeper OEM excerpts and richer graph data.',
          'x-payment-info': [x402Payment, stripePayment],
          parameters: [
            {
              name: 'year',
              in: 'query',
              required: true,
              schema: { type: 'integer', example: 2010 },
              description: 'Vehicle model year',
            },
            {
              name: 'make',
              in: 'query',
              required: true,
              schema: { type: 'string', example: 'toyota' },
              description: 'Vehicle make slug',
            },
            {
              name: 'model',
              in: 'query',
              required: true,
              schema: { type: 'string', example: 'camry' },
              description: 'Vehicle model slug',
            },
            {
              name: 'task',
              in: 'query',
              required: true,
              schema: { type: 'string', example: 'brake-pad-replacement' },
              description: 'Repair task slug',
            },
          ],
          responses: {
            '200': {
              description: 'Premium repair data',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/PremiumRepairResponse' },
                },
              },
            },
            '402': {
              description: 'Payment Required — x402 payment needed',
              headers: {
                'X-Payment-Required': {
                  schema: { type: 'string' },
                  description: 'x402 payment requirements',
                },
                Link: {
                  schema: { type: 'string' },
                  description: 'Payment discovery URL',
                },
              },
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/PaymentRequired' },
                },
              },
            },
            '404': {
              description: 'Invalid vehicle or task combination',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/graph/dtc/{code}': {
        get: {
          tags: ['Diagnostics'],
          summary: 'DTC code lookup',
          description:
            'Look up diagnostic trouble code information with graph-linked procedures and components. Free tier: 100 req/day.',
          'x-payment-info': [],
          parameters: [
            {
              name: 'code',
              in: 'path',
              required: true,
              schema: { type: 'string', example: 'P0420' },
              description: 'OBD-II DTC code (e.g. P0420, B1234, C0561)',
            },
          ],
          responses: {
            '200': {
              description: 'DTC information',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/DTCResponse' },
                },
              },
            },
            '400': {
              description: 'Missing code parameter',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/data/{year}/{make}/{model}': {
        get: {
          tags: ['Training Feed'],
          summary: 'AI Training Feed — Clean Markdown Vehicle Data',
          description:
            'De-humanized, structured factory manual data in clean markdown format. No affiliate links, no navigation, no ads. Optimized for AI model training, RAG grounding, and agent consumption. Returns full vehicle hub by default; append /repairs/{task}, /dtc, or /specs for subsets. Paid via x402 (Solana devnet) or Stripe credits at $0.01 per page. Volume discounts: 100K+ pages at $0.005, 1M+ at $0.001.',
          'x-payment-info': [x402Payment, stripePayment],
          parameters: [
            {
              name: 'year',
              in: 'path',
              required: true,
              schema: { type: 'integer', minimum: 1960, maximum: 2025, example: 2010 },
              description: 'Vehicle model year',
            },
            {
              name: 'make',
              in: 'path',
              required: true,
              schema: { type: 'string', example: 'toyota' },
              description: 'Vehicle make slug',
            },
            {
              name: 'model',
              in: 'path',
              required: true,
              schema: { type: 'string', example: 'camry' },
              description: 'Vehicle model slug',
            },
            {
              name: 'section',
              in: 'path',
              required: false,
              schema: { type: 'string', example: 'repairs/oil-change' },
              description: 'Optional subsection: repairs/{task}, dtc, or specs',
            },
          ],
          responses: {
            '200': {
              description: 'Clean markdown vehicle data',
              headers: {
                'X-Payment-Info': {
                  schema: { type: 'string' },
                  description: 'x402 payment requirements',
                },
              },
              content: {
                'text/markdown': {
                  schema: { type: 'string' },
                },
              },
            },
            '402': {
              description: 'Payment Required — x402 payment needed',
              headers: {
                'X-Payment-Required': {
                  schema: { type: 'string' },
                  description: 'x402 payment requirements',
                },
                Link: {
                  schema: { type: 'string' },
                  description: 'Payment discovery URL',
                },
              },
              content: {
                'text/markdown': {
                  schema: { type: 'string' },
                },
              },
            },
            '404': {
              description: 'Invalid vehicle combination',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/stripe/checkout': {
        get: {
          tags: ['Payments'],
          summary: 'Create Stripe Checkout Session',
          description:
            'Creates a Stripe Checkout Session for a prepaid credit pack. Returns a URL to complete payment. After payment, the webhook credits the account and /api/account returns the API key.',
          'x-payment-info': [],
          parameters: [
            {
              name: 'pack',
              in: 'query',
              required: false,
              schema: { type: 'string', enum: ['starter', 'growth', 'scale', 'enterprise'], example: 'starter' },
              description: 'Credit pack to purchase',
            },
            {
              name: 'email',
              in: 'query',
              required: false,
              schema: { type: 'string', example: 'dev@example.com' },
              description: 'Customer email for Stripe Checkout',
            },
          ],
          responses: {
            '200': {
              description: 'Checkout session created',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      url: { type: 'string' },
                      pack: { type: 'object' },
                    },
                  },
                },
              },
            },
            '500': {
              description: 'Stripe not configured or price missing',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/stripe/webhook': {
        post: {
          tags: ['Payments'],
          summary: 'Stripe Webhook',
          description: 'Receives Stripe webhook events. Currently processes checkout.session.completed to credit customer accounts.',
          'x-payment-info': [],
          responses: {
            '200': {
              description: 'Webhook processed',
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { received: { type: 'boolean' } } },
                },
              },
            },
            '400': {
              description: 'Invalid signature or metadata',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/account': {
        get: {
          tags: ['Payments'],
          summary: 'Get account balance and API key',
          description:
            'Returns the API key, current credit balance, and recent transaction history for the authenticated customer. Can also be used as a Stripe success URL to retrieve the API key after checkout.',
          'x-payment-info': [],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: 'session_id',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Stripe Checkout Session ID (used after redirect from checkout)',
            },
          ],
          responses: {
            '200': {
              description: 'Account details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      customer_id: { type: 'string' },
                      email: { type: 'string' },
                      balance_cents: { type: 'integer' },
                      balance_usd: { type: 'string' },
                      api_key: { type: 'string' },
                      transactions: { type: 'array' },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Authentication required',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
        post: {
          tags: ['Payments'],
          summary: 'Account actions',
          description: 'Rotate API key or update account email. Requires Bearer API key.',
          'x-payment-info': [],
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    action: { type: 'string', enum: ['rotate_key'], example: 'rotate_key' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Action completed',
              content: {
                'application/json': {
                  schema: { type: 'object' },
                },
              },
            },
            '401': {
              description: 'Authentication required',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/graph/diagnose': {
        get: {
          tags: ['Diagnostics'],
          summary: 'Graph-based diagnosis',
          description:
            'Neo4j-powered diagnosis by DTC + year/make/model. Returns linked procedures, tools, specs, and likely root causes. Free tier: 50 req/day.',
          'x-payment-info': [],
          parameters: [
            {
              name: 'dtc',
              in: 'query',
              required: true,
              schema: { type: 'string', example: 'P0171' },
              description: 'Diagnostic trouble code',
            },
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
              schema: { type: 'string', example: 'ford' },
              description: 'Vehicle make slug',
            },
            {
              name: 'model',
              in: 'query',
              required: true,
              schema: { type: 'string', example: 'focus' },
              description: 'Vehicle model slug',
            },
          ],
          responses: {
            '200': {
              description: 'Diagnosis result',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/DiagnosisResponse' },
                },
              },
            },
            '400': {
              description: 'Missing required parameters',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Missing required parameters: year, make, model, task' },
          },
        },
        PaymentRequired: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Payment Required' },
            message: { type: 'string' },
            policy: { type: 'string', example: 'ai-train=licensed, search=yes, ai-input=licensed' },
            payment_discovery: { type: 'string', example: 'https://alloemmanuals.com/.well-known/acp.json' },
            premium_api: { type: 'string', example: 'https://alloemmanuals.com/api/premium-repair-data' },
          },
        },
        Vehicle: {
          type: 'object',
          properties: {
            year: { type: 'string', example: '2013' },
            make: { type: 'string', example: 'BMW' },
            model: { type: 'string', example: 'X3' },
            name: { type: 'string', example: '2013 BMW X3' },
          },
        },
        Task: {
          type: 'object',
          properties: {
            slug: { type: 'string', example: 'oil-change' },
            title: { type: 'string', example: 'Oil Change' },
            description: { type: 'string' },
          },
        },
        RepairGuide: {
          type: 'object',
          properties: {
            difficulty: { type: 'string', example: 'Easy' },
            estimatedTime: { type: 'string', example: '30-45 minutes' },
            tools: { type: 'array', items: { type: 'string' } },
            parts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  spec: { type: 'string' },
                  oem: { type: 'string' },
                  aftermarket: { type: 'string' },
                },
              },
            },
            warnings: { type: 'array', items: { type: 'string' } },
            steps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  stepNumber: { type: 'integer' },
                  instruction: { type: 'string' },
                },
              },
            },
            torqueSpecs: { type: 'string', example: 'Drain plug: 18 ft-lbs | Filter cap: 18 ft-lbs' },
            beltRouting: { type: 'string', nullable: true },
            vehicleNotes: { type: 'array', items: { type: 'string' }, nullable: true },
          },
        },
        OEMExcerpt: {
          type: 'object',
          properties: {
            title: { type: 'string', example: 'Lubrication System Capacity' },
            content: { type: 'string' },
            source: { type: 'string', example: 'Factory Service Manual' },
          },
        },
        KnowledgeGraph: {
          type: 'object',
          properties: {
            groups: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  kind: { type: 'string', example: 'spec' },
                  title: { type: 'string' },
                  nodes: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        label: { type: 'string' },
                        description: { type: 'string' },
                        href: { type: 'string' },
                        badge: { type: 'string', nullable: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        RepairGuideResponse: {
          allOf: [
            {
              type: 'object',
              properties: {
                vehicle: { $ref: '#/components/schemas/Vehicle' },
                task: { $ref: '#/components/schemas/Task' },
                url: { type: 'string', example: 'https://alloemmanuals.com/repair/2013/bmw/x3/oil-change' },
                guide: { $ref: '#/components/schemas/RepairGuide' },
                oemExcerpts: { type: 'array', items: { $ref: '#/components/schemas/OEMExcerpt' } },
                knowledgeGraph: { $ref: '#/components/schemas/KnowledgeGraph' },
                generated: { type: 'boolean', description: 'True if a generated repair profile exists' },
                corpusBacked: { type: 'boolean', description: 'True if year falls in CHARM/LEMON corpus range' },
              },
            },
          ],
        },
        PremiumRepairResponse: {
          allOf: [
            { $ref: '#/components/schemas/RepairGuideResponse' },
            {
              type: 'object',
              properties: {
                tier: { type: 'string', example: 'premium' },
                payment: {
                  type: 'object',
                  properties: {
                    protocol: { type: 'string', example: 'x402' },
                    scheme: { type: 'string', example: 'exact' },
                    price: { type: 'string', example: '$0.01' },
                    asset: { type: 'string', example: 'USDC' },
                    network: { type: 'string', example: 'solana' },
                  },
                },
              },
            },
          ],
        },
        DTCResponse: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'P0420' },
            description: { type: 'string' },
            component: { type: 'string' },
            procedures: { type: 'array', items: { type: 'object' } },
            graphData: { type: 'object' },
          },
        },
        DiagnosisResponse: {
          type: 'object',
          properties: {
            dtc: { type: 'string' },
            vehicle: { $ref: '#/components/schemas/Vehicle' },
            procedures: { type: 'array', items: { type: 'object' } },
            tools: { type: 'array', items: { type: 'string' } },
            likelyCauses: { type: 'array', items: { type: 'string' } },
            graph: { $ref: '#/components/schemas/KnowledgeGraph' },
          },
        },
      },
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
          description: 'Bearer API key from /api/account after Stripe checkout.',
        },
        x402: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
          description: 'x402 payment token (Authorization header).',
        },
      },
    },
  };

  return NextResponse.json(spec, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    },
  });
}
