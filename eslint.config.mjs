import nextVitals from 'eslint-config-next/core-web-vitals';

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
  ...nextVitals,
  {
    files: ['src/**/*.{js,jsx,ts,tsx}', 'next.config.js'],
    rules: {
      '@next/next/no-img-element': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/immutability': 'off',
    },
  },
];
