import { NextResponse } from 'next/server';

/**
 * JSON Web Key Set (JWKS) — minimal stub for OAuth/OIDC discovery.
 */
export async function GET() {
  const jwks = {
    keys: [],
  };

  return NextResponse.json(jwks, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
