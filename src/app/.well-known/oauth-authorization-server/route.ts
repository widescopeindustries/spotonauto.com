import { NextResponse } from 'next/server';

/**
 * OAuth 2.0 Authorization Server Metadata (RFC 8414).
 * Declares that this site does not require OAuth for public APIs,
 * but uses x402 for premium endpoints.
 */
export async function GET() {
  const metadata = {
    issuer: 'https://alloemmanuals.com',
    authorization_endpoint: 'https://alloemmanuals.com/.well-known/oauth-authorization-server',
    token_endpoint: 'https://alloemmanuals.com/.well-known/oauth-authorization-server',
    jwks_uri: 'https://alloemmanuals.com/.well-known/jwks.json',
    registration_endpoint: 'https://alloemmanuals.com/.well-known/oauth-authorization-server',
    scopes_supported: ['read:repair', 'read:dtc', 'read:premium'],
    response_types_supported: ['token'],
    grant_types_supported: ['client_credentials'],
    token_endpoint_auth_methods_supported: ['none'],
    agent_auth: {
      register_uri: 'https://alloemmanuals.com/auth.md',
      supported_identity_types: ['domain', 'did'],
      supported_credential_types: ['api_key', 'x402_payment'],
    },
  };

  return NextResponse.json(metadata, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
