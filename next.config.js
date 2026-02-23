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
}

module.exports = nextConfig
