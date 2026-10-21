import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AllOEMManuals — Factory Service Manuals & Repair Guides',
    short_name: 'AllOEMManuals',
    description: 'Free OEM factory service manuals, color wiring diagrams, torque specs, DTC diagnostics, and step-by-step repair guides for 300,000+ vehicles.',
    start_url: '/',
    display: 'standalone',
    background_color: '#090d16',
    theme_color: '#2563eb',
    orientation: 'any',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['automotive', 'utilities', 'productivity', 'education'],
  };
}
