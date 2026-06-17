import { NextResponse } from 'next/server';

/**
 * Lightweight health endpoint for deploy verification and load balancer checks.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'alloemmanuals-web',
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      },
    }
  );
}
