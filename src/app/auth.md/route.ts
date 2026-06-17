import { NextResponse } from 'next/server';

/**
 * Auth.md — Agent registration and authentication instructions.
 * https://workos.com/blog/introducing-auth-md
 */
export async function GET() {
  const body = `# auth.md — Agent Authentication for AllOEMManuals

## Agent Registration

AI agents can register and authenticate with AllOEMManuals to access factory repair data for 300,000+ vehicles.

### How to Register

**Step 1**: Review the API catalog at \`/.well-known/api-catalog\`

**Step 2**: Choose your access level:
- **Free tier**: No registration required. Use public endpoints immediately.
- **Premium tier**: Pay per request via x402. No account needed.
- **Partner tier**: Contact us for API key provisioning.

**Step 3**: For partner access, email \`lyndon@widescopeindustries.com\` with:
- Your domain or DID
- Intended use case
- Expected request volume

**Step 4**: Upon approval, receive your API key and begin accessing premium endpoints.

### Registration Endpoint

- **Register**: https://alloemmanuals.com/auth.md
- **OAuth Authorization Server**: https://alloemmanuals.com/.well-known/oauth-authorization-server
- **OAuth Protected Resource**: https://alloemmanuals.com/.well-known/oauth-protected-resource

### Supported Identity Types

- \`domain\` — Domain-verified agents
- \`did\` — DID-based agents  
- \`anonymous\` — Anonymous agents (limited access)

### Supported Credential Types

- \`api_key\` — For high-volume partners
- \`x402_payment\` — For premium data access

### Claim URI

Contact \`lyndon@widescopeindustries.com\` for API key provisioning and partner access.

## Free Access

The following endpoints are available without authentication or registration:

- **Vehicle Hubs**: \`GET /vehicles/{year}/{make}/{model}\` — Browse all content for a specific vehicle
- **Repair Guides**: \`GET /repair/{year}/{make}/{model}/{task}\` — Vehicle-specific repair procedures
- **DTC Lookup**: \`GET /api/graph/dtc/{code}\` — Diagnostic trouble code information
- **API Catalog**: \`GET /.well-known/api-catalog\` — Discovery via RFC 9727
- **MCP Server Card**: \`GET /.well-known/mcp/server-card.json\`
- **Agent Skills**: \`GET /.well-known/agent-skills/index.json\`

## Paid Access

Premium structured OEM data is available through two payment models:

### Option A: Stripe Credits (Recommended for most agents)

- **Endpoint**: \`GET /api/data/{year}/{make}/{model}\`
- **Pricing**: $0.01 per page; volume discounts at 100K+ and 1M+ pages/month
- **Purchase**: \`GET /api/stripe/checkout?pack=starter\`
- **Auth**: \`Authorization: Bearer <api_key>\` (shown once after checkout)
- **Info**: https://alloemmanuals.com/for-ai

### Option B: x402 (Agent-Native, Solana Devnet)

- **Endpoint**: \`GET /api/premium-repair-data\` or \`GET /api/data/{year}/{make}/{model}\`
- **Payment**: x402 exact scheme on Solana devnet (USDC, $0.01 per request)
- **Discovery**: \`GET /.well-known/acp.json\`
- **UCP Profile**: \`GET /.well-known/ucp\`

### x402 Payment Flow

1. Agent requests a paid endpoint without payment
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
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    },
  });
}
