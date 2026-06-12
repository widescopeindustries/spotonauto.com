import { NextResponse } from 'next/server';

/**
 * Agentic Commerce Protocol (ACP) discovery document.
 * Advertises the x402 payment-gated API to AI agents.
 */
export async function GET() {
  const premiumService = {
    id: 'premium-repair-data',
    name: 'Premium Factory Repair Data',
    description:
      'Structured OEM repair data including torque specs, fluid capacities, wiring diagrams, and part numbers. Paid via x402 on Solana devnet (mainnet-ready).',
    endpoint: 'https://alloemmanuals.com/api/premium-repair-data',
    payment: {
      protocol: 'x402',
      scheme: 'exact',
      price: '$0.01',
      asset: 'USDC',
      network: 'solana-devnet',
    },
  };

  const trainingFeedService = {
    id: 'ai-training-feed',
    name: 'AI Training Feed — Clean Markdown Vehicle Data',
    description:
      'De-humanized, structured factory manual data in clean markdown format. No affiliate links, no navigation, no ads. Optimized for AI model training, RAG grounding, and agent consumption. 300K+ vehicles (1960–2025).',
    endpoint: 'https://alloemmanuals.com/api/data/{year}/{make}/{model}',
    payment: {
      protocol: 'x402',
      scheme: 'exact',
      price: '$0.01',
      asset: 'USDC',
      network: 'solana-devnet',
      per: 'page',
      volume_discounts: {
        '100000': '$0.005',
        '1000000': '$0.001',
      },
    },
    formats: ['text/markdown'],
    coverage: '300000+ vehicles (1960–2025)',
    sections: [
      { path: '/api/data/{year}/{make}/{model}', description: 'Full vehicle hub (specs, DTCs, repairs)' },
      { path: '/api/data/{year}/{make}/{model}/repairs/{task}', description: 'Specific repair guide with OEM excerpts' },
      { path: '/api/data/{year}/{make}/{model}/dtc', description: 'Diagnostic trouble codes' },
      { path: '/api/data/{year}/{make}/{model}/specs', description: 'Factory specifications only' },
    ],
  };

  const services = [premiumService, trainingFeedService];

  const acp = {
    protocol: {
      name: 'acp',
      version: '0.1.0',
    },
    api_base_url: 'https://alloemmanuals.com',
    transports: ['https', 'x402'],
    capabilities: {
      services,
    },
    services,
    acp: {
      version: '0.1.0',
      protocol: {
        name: 'acp',
        version: '0.1.0',
      },
      name: 'acp',
      api_base_url: 'https://alloemmanuals.com',
      transports: ['https', 'x402'],
      capabilities: {
        services,
      },
    },
  };

  return NextResponse.json(acp, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    },
  });
}
