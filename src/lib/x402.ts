import { paymentProxy, x402ResourceServer } from '@x402/next';
import { HTTPFacilitatorClient } from '@x402/core/server';
import { registerExactSvmScheme } from '@x402/svm/exact/server';
import { SOLANA_DEVNET_CAIP2 } from '@x402/svm';
import type { RoutesConfig } from '@x402/core/server';

const SOLANA_PAY_TO = process.env.X402_SOLANA_PAY_TO;
const FACILITATOR_URL = process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';

function createX402Proxy() {
  if (!SOLANA_PAY_TO) {
    // x402 is not configured; return no-op handler
    return null;
  }

  const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
  const server = new x402ResourceServer(facilitatorClient);
  registerExactSvmScheme(server);

  const routes = {
    'GET /api/premium-repair-data': {
      accepts: {
        scheme: 'exact' as const,
        network: SOLANA_DEVNET_CAIP2,
        payTo: SOLANA_PAY_TO,
        price: '$0.01' as const,
      },
      description: 'Premium factory repair data including torque specs, fluid capacities, and OEM part numbers.',
      mimeType: 'application/json',
    },
    'GET /api/data/*': {
      accepts: {
        scheme: 'exact' as const,
        network: SOLANA_DEVNET_CAIP2,
        payTo: SOLANA_PAY_TO,
        price: '$0.01' as const,
      },
      description: 'Clean markdown vehicle data feed for AI training and agent consumption. No affiliate links, no navigation, structured for machine reading.',
      mimeType: 'text/markdown',
    },
  } satisfies RoutesConfig;

  return paymentProxy(routes, server);
}

export const x402Proxy = createX402Proxy();
