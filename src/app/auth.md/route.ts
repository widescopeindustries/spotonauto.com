import { NextResponse } from 'next/server';

/**
 * Auth.md — Agent registration and authentication instructions.
 * https://workos.com/blog/introducing-auth-md
 */
export async function GET() {
  const body = `# auth.md — Agent Authentication for AllOEMManuals

## Agent Registration

AI agents can register and authenticate with AllOEMManuals to access factory repair data for 300,000+ vehicles.

### Registration Methods

1. **No registration required** for free public endpoints
2. **x402 payment** for premium data — no account needed, pay per request

### Supported Identity Types

- Domain-verified agents
- DID-based agents
- Anonymous agents (limited access)

### Supported Credential Types

- API key (for high-volume partners)
- x402 payment proof (for premium data)

### Registration Endpoint

- **Register**: No formal registration required. Start using public endpoints immediately.
- **Paywall access**: \`GET /api/premium-repair-data\` — returns 402 with x402 payment requirements
- **Claim credentials**: Contact \`lyndon@widescopeindustries.com\` for API key provisioning

### Credential Usage

- Public endpoints: No credentials required
- Premium endpoints: Include \`X-Payment-Proof\` header with x402 payment token

## Free Access

The following endpoints are available without authentication or registration:

- **Vehicle Hubs**: \`GET /vehicles/{year}/{make}/{model}\` — Browse all content for a specific vehicle
- **Repair Guides**: \`GET /repair/{year}/{make}/{model}/{task}\` — Vehicle-specific repair procedures
- **DTC Lookup**: \`GET /api/v1/dtc?code={code}\` — Diagnostic trouble code information
- **API Catalog**: \`GET /.well-known/api-catalog\` — Discovery via RFC 9727
- **MCP Server Card**: \`GET /.well-known/mcp/server-card.json\`
- **Agent Skills**: \`GET /.well-known/agent-skills/index.json\`

## Paid Access (x402)

Premium structured OEM data requires payment via the x402 protocol:

- **Endpoint**: \`GET /api/premium-repair-data\`
- **Payment**: x402 on Solana devnet (USDC, $0.01 per request)
- **Discovery**: \`GET /.well-known/acp.json\`
- **UCP Profile**: \`GET /.well-known/ucp\`

### x402 Payment Flow

1. Agent requests \`/api/premium-repair-data\` without payment
2. Server responds with **402 Payment Required** and \`X-Payment-Required\` header
3. Agent obtains payment proof from x402 facilitator
4. Agent re-requests with \`X-Payment-Proof\` header
5. Server returns premium data

## Bot Policy

- **Allowed bots** (free crawl): Googlebot, Bingbot, DuckDuckBot, DuckAssistBot, ChatGPT-User
- **Paywalled bots**: GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Amazonbot, Meta-ExternalAgent, Applebot, TikTok Spider, CCBot
- **Blocked bots**: AhrefsBot, SemrushBot, DotBot, MJ12bot, and other SEO scrapers

## Contact

For agent integration questions: \`lyndon@widescopeindustries.com\`
`;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
}
