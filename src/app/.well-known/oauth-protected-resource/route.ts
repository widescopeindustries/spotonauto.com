import { NextResponse } from 'next/server';

/**
 * OAuth Protected Resource Metadata (RFC 9728).
 */
export async function GET() {
  const metadata = {
    resource: 'https://alloemmanuals.com/api/premium-repair-data',
    authorization_servers: ['https://alloemmanuals.com/.well-known/oauth-authorization-server'],
    scopes_supported: ['read:premium'],
    bearer_methods_supported: ['header'],
  };

  return NextResponse.json(metadata, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
