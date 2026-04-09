import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'public/**',
      'supabase/.temp/**',
      'workers/**',
    ],
  },
  ...compat
    .extends('next/core-web-vitals')
    .map((config) => ({
      ...config,
      files: ['src/**/*.{js,jsx,ts,tsx}', 'next.config.js'],
    })),
];
