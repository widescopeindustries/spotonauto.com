/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.topdon.us', pathname: '/cdn/shop/**' },
      { protocol: 'https', hostname: 'creatives.goaffpro.com' },
    ],
  },
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
              "connect-src 'self' https://*.supabase.co https://*.google-analytics.com https://*.googleapis.com https://*.googletagmanager.com https://analytics.ahrefs.com https://*.intercom.io https://*.intercomcdn.com https://*.googlesyndication.com https://*.adtrafficquality.google https://*.doubleclick.net https://*.google.com https://vpic.nhtsa.dot.gov https://data.spotonauto.com https://spotonauto-charm-proxy.wandering-frog-3cea.workers.dev https://fundingchoicesmessages.google.com",
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
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.spotonauto.com' }],
        destination: 'https://spotonauto.com/:path*',
        permanent: true,
      },
      { source: '/tools/ford-f150-oil-type', destination: '/tools/ford-f-150-oil-type', permanent: true },
      { source: '/tools/ford-f150-battery-location', destination: '/tools/ford-f-150-battery-location', permanent: true },
      { source: '/tools/ford-f150-tire-size', destination: '/tools/ford-f-150-tire-size', permanent: true },
      { source: '/tools/honda-crv-oil-type', destination: '/tools/honda-cr-v-oil-type', permanent: true },
      { source: '/tools/honda-crv-tire-size', destination: '/tools/honda-cr-v-tire-size', permanent: true },
      { source: '/login', destination: '/auth', permanent: true },
      { source: '/signup', destination: '/auth', permanent: true },
      // Consolidate overlapping routes
      { source: '/repairs', destination: '/repair', permanent: true },
      { source: '/cel', destination: '/codes', permanent: true },
      { source: '/scanner', destination: '/', permanent: true },
      { source: '/simulation', destination: '/', permanent: true },

      // ── International model name redirects ──────────────────────────────
      // Nissan Qashqai → Rogue Sport
      { source: '/repair/:year/nissan/qashqai/:task', destination: '/repair/:year/nissan/rogue-sport/:task', permanent: true },
      { source: '/wiring/:year/nissan/qashqai/:system', destination: '/wiring/:year/nissan/rogue-sport/:system', permanent: true },
      { source: '/tools/nissan-qashqai-:tool', destination: '/tools/nissan-rogue-sport-:tool', permanent: true },
      // Mitsubishi Pajero → Montero
      { source: '/repair/:year/mitsubishi/pajero/:task', destination: '/repair/:year/mitsubishi/montero/:task', permanent: true },
      { source: '/wiring/:year/mitsubishi/pajero/:system', destination: '/wiring/:year/mitsubishi/montero/:system', permanent: true },
      { source: '/tools/mitsubishi-pajero-:tool', destination: '/tools/mitsubishi-montero-:tool', permanent: true },
      // Mitsubishi ASX → Outlander Sport
      { source: '/repair/:year/mitsubishi/asx/:task', destination: '/repair/:year/mitsubishi/outlander-sport/:task', permanent: true },
      { source: '/wiring/:year/mitsubishi/asx/:system', destination: '/wiring/:year/mitsubishi/outlander-sport/:system', permanent: true },
      { source: '/tools/mitsubishi-asx-:tool', destination: '/tools/mitsubishi-outlander-sport-:tool', permanent: true },
      // Hyundai i30 → Elantra GT
      { source: '/repair/:year/hyundai/i30/:task', destination: '/repair/:year/hyundai/elantra-gt/:task', permanent: true },
      { source: '/wiring/:year/hyundai/i30/:system', destination: '/wiring/:year/hyundai/elantra-gt/:system', permanent: true },
      { source: '/tools/hyundai-i30-:tool', destination: '/tools/hyundai-elantra-gt-:tool', permanent: true },
      // Hyundai i20 / Elite i20 → Accent
      { source: '/repair/:year/hyundai/i20/:task', destination: '/repair/:year/hyundai/accent/:task', permanent: true },
      { source: '/wiring/:year/hyundai/i20/:system', destination: '/wiring/:year/hyundai/accent/:system', permanent: true },
      { source: '/tools/hyundai-i20-:tool', destination: '/tools/hyundai-accent-:tool', permanent: true },
      { source: '/repair/:year/hyundai/elite-i20/:task', destination: '/repair/:year/hyundai/accent/:task', permanent: true },
      { source: '/wiring/:year/hyundai/elite-i20/:system', destination: '/wiring/:year/hyundai/accent/:system', permanent: true },
      { source: '/tools/hyundai-elite-i20-:tool', destination: '/tools/hyundai-accent-:tool', permanent: true },
      // Ford Mondeo → Fusion
      { source: '/repair/:year/ford/mondeo/:task', destination: '/repair/:year/ford/fusion/:task', permanent: true },
      { source: '/wiring/:year/ford/mondeo/:system', destination: '/wiring/:year/ford/fusion/:system', permanent: true },
      { source: '/tools/ford-mondeo-:tool', destination: '/tools/ford-fusion-:tool', permanent: true },
      // Toyota Hilux → Tacoma
      { source: '/repair/:year/toyota/hilux/:task', destination: '/repair/:year/toyota/tacoma/:task', permanent: true },
      { source: '/wiring/:year/toyota/hilux/:system', destination: '/wiring/:year/toyota/tacoma/:system', permanent: true },
      { source: '/tools/toyota-hilux-:tool', destination: '/tools/toyota-tacoma-:tool', permanent: true },
      // Toyota Auris → Corolla
      { source: '/repair/:year/toyota/auris/:task', destination: '/repair/:year/toyota/corolla/:task', permanent: true },
      { source: '/wiring/:year/toyota/auris/:system', destination: '/wiring/:year/toyota/corolla/:system', permanent: true },
      { source: '/tools/toyota-auris-:tool', destination: '/tools/toyota-corolla-:tool', permanent: true },
      // Honda Jazz → Fit
      { source: '/repair/:year/honda/jazz/:task', destination: '/repair/:year/honda/fit/:task', permanent: true },
      { source: '/wiring/:year/honda/jazz/:system', destination: '/wiring/:year/honda/fit/:system', permanent: true },
      { source: '/tools/honda-jazz-:tool', destination: '/tools/honda-fit-:tool', permanent: true },
      // Volkswagen Polo → Golf
      { source: '/repair/:year/volkswagen/polo/:task', destination: '/repair/:year/volkswagen/golf/:task', permanent: true },
      { source: '/wiring/:year/volkswagen/polo/:system', destination: '/wiring/:year/volkswagen/golf/:system', permanent: true },
      { source: '/tools/volkswagen-polo-:tool', destination: '/tools/volkswagen-golf-:tool', permanent: true },
      // Kia Ceed → Forte
      { source: '/repair/:year/kia/ceed/:task', destination: '/repair/:year/kia/forte/:task', permanent: true },
      { source: '/wiring/:year/kia/ceed/:system', destination: '/wiring/:year/kia/forte/:system', permanent: true },
      { source: '/tools/kia-ceed-:tool', destination: '/tools/kia-forte-:tool', permanent: true },
      // Mercedes GLK350 / GLK-Class → GLK
      { source: '/repair/:year/mercedes/glk350/:task', destination: '/repair/:year/mercedes/glk/:task', permanent: true },
      { source: '/wiring/:year/mercedes/glk350/:system', destination: '/wiring/:year/mercedes/glk/:system', permanent: true },
      { source: '/tools/mercedes-glk350-:tool', destination: '/tools/mercedes-glk-:tool', permanent: true },
      { source: '/repair/:year/mercedes/glk-class/:task', destination: '/repair/:year/mercedes/glk/:task', permanent: true },
      { source: '/wiring/:year/mercedes/glk-class/:system', destination: '/wiring/:year/mercedes/glk/:system', permanent: true },
      { source: '/tools/mercedes-glk-class-:tool', destination: '/tools/mercedes-glk-:tool', permanent: true },
    ];
  },
}

module.exports = nextConfig
