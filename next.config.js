/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure API routes work properly
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Inline critical CSS and defer the rest — eliminates render-blocking CSS
    // Requires: npm install --save-dev critters
    optimizeCss: true,
  },
  // Make env vars available at build time
  env: {
    NEXT_PUBLIC_STRIPE_PRO_MONTHLY_LINK: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_LINK || 'https://buy.stripe.com/cNi14na6t8iycykeo718c08',
    NEXT_PUBLIC_STRIPE_PRO_PLUS_MONTHLY_LINK: process.env.NEXT_PUBLIC_STRIPE_PRO_PLUS_MONTHLY_LINK || 'https://buy.stripe.com/fZubJ192pdCS1TGeo718c09',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://analytics.ahrefs.com https://widget.intercom.io https://js.intercomcdn.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://*.google-analytics.com https://*.googleapis.com https://*.googletagmanager.com https://analytics.ahrefs.com https://*.intercom.io https://*.intercomcdn.com",
              "frame-src 'self' https://googleads.g.doubleclick.net https://www.google.com https://tpc.googlesyndication.com",
              "media-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: '/tools/ford-f150-oil-type', destination: '/tools/ford-f-150-oil-type', permanent: true },
      { source: '/tools/ford-f150-battery-location', destination: '/tools/ford-f-150-battery-location', permanent: true },
      { source: '/tools/ford-f150-tire-size', destination: '/tools/ford-f-150-tire-size', permanent: true },
      { source: '/tools/honda-crv-oil-type', destination: '/tools/honda-cr-v-oil-type', permanent: true },
      { source: '/tools/honda-crv-tire-size', destination: '/tools/honda-cr-v-tire-size', permanent: true },
    ];
  },
}

module.exports = nextConfig
