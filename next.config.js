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
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://*.googlesyndication.com https://analytics.ahrefs.com https://widget.intercom.io https://js.intercomcdn.com https://adservice.google.com https://www.google.com https://*.adtrafficquality.google https://fundingchoicesmessages.google.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://*.google-analytics.com https://*.googleapis.com https://*.googletagmanager.com https://analytics.ahrefs.com https://*.intercom.io https://*.intercomcdn.com https://*.googlesyndication.com https://*.adtrafficquality.google https://*.doubleclick.net https://*.google.com https://vpic.nhtsa.dot.gov https://data.spotonauto.com https://fundingchoicesmessages.google.com",
              "frame-src 'self' https://googleads.g.doubleclick.net https://*.doubleclick.net https://www.google.com https://tpc.googlesyndication.com https://*.googlesyndication.com https://fundingchoicesmessages.google.com",
              "media-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
      {
        // Matches: /sitemap.xml, /codes/sitemap.xml, /community/sitemap.xml
        source: '/:path*/sitemap.xml',
        headers: [
          { key: 'Content-Type', value: 'application/xml; charset=utf-8' },
          { key: 'Vary', value: 'Accept-Encoding' },
          { key: 'Cache-Control', value: 'public, max-age=86400, s-maxage=86400' },
        ],
      },
      {
        // Matches: /repair/sitemap/0.xml, /repair/sitemap/1.xml (static public files)
        source: '/:path*/sitemap/:file.xml',
        headers: [
          { key: 'Content-Type', value: 'application/xml; charset=utf-8' },
          { key: 'Vary', value: 'Accept-Encoding' },
          { key: 'Cache-Control', value: 'public, max-age=86400, s-maxage=86400' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
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
      { source: '/login', destination: '/auth', permanent: true },
      { source: '/signup', destination: '/auth', permanent: true },
    ];
  },
}

module.exports = nextConfig
