import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple in-memory IP rate limiter for Vercel serverless.
 *
 * Per-instance (resets on cold start), but combined with origin
 * middleware this blocks both external access and rapid-fire abuse
 * from warm instances.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

/** Remove stale entries every 2 minutes to prevent memory leaks in warm lambdas */
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, val] of buckets) {
            if (now > val.resetAt) buckets.delete(key);
        }
    }, 120_000);
}

/**
 * Check if the request is within rate limits.
 * Returns null if allowed, or a 429 Response if blocked.
 */
export function checkRateLimit(
    req: NextRequest,
    limit: number,
    windowMs: number
): NextResponse | null {
    const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        'unknown';

    const now = Date.now();
    const record = buckets.get(ip);

    if (!record || now > record.resetAt) {
        buckets.set(ip, { count: 1, resetAt: now + windowMs });
        return null; // allowed
    }

    if (record.count >= limit) {
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            {
                status: 429,
                headers: {
                    'Retry-After': String(Math.ceil((record.resetAt - now) / 1000)),
                },
            }
        );
    }

    record.count++;
    return null; // allowed
}
