import { NextResponse } from 'next/server';

/**
 * Web Bot Auth — HTTP Message Signatures Directory.
 * Lists supported signature algorithms and key locations for bot request verification.
 */
export async function GET() {
  const directory = {
    keys: [
      {
        id: 'alloemmanuals-signing-key-2026',
        algorithm: 'ed25519',
        url: 'https://alloemmanuals.com/.well-known/http-message-signatures-directory/key.pem',
        purpose: 'request-verification',
        status: 'active',
        created: '2026-06-10T00:00:00Z',
      },
    ],
    supported_algorithms: ['ed25519', 'rsa-pss-sha512', 'ecdsa-p256-sha256'],
    documentation: 'https://alloemmanuals.com/',
  };

  return NextResponse.json(directory, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
