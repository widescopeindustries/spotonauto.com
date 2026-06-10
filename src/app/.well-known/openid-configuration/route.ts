import { NextResponse } from 'next/server';

/**
 * OpenID Connect Discovery (OIDC) — minimal stub.
 * This site does not use OIDC login; public APIs are open,
 * premium APIs use x402 payment instead of OAuth.
 */
export async function GET() {
  const config = {
    issuer: 'https://alloemmanuals.com',
    authorization_endpoint: 'https://alloemmanuals.com/.well-known/oauth-authorization-server',
    token_endpoint: 'https://alloemmanuals.com/.well-known/oauth-authorization-server',
    jwks_uri: 'https://alloemmanuals.com/.well-known/jwks.json',
    userinfo_endpoint: 'https://alloemmanuals.com/.well-known/oauth-authorization-server',
    scopes_supported: ['openid', 'read:repair', 'read:dtc', 'read:premium'],
    response_types_supported: ['token'],
    grant_types_supported: ['client_credentials'],
    token_endpoint_auth_methods_supported: ['none'],
    agent_auth: {
      register_uri: 'https://alloemmanuals.com/auth.md',
      supported_identity_types: ['domain', 'did'],
      supported_credential_types: ['api_key', 'x402_payment'],
    },
  };

  return NextResponse.json(config, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
