/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./contexts/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
        "./App.tsx",
        "./index.tsx"
    ],
    theme: {
        extend: {
            colors: {
                'brand-black': '#050505',
                'brand-cyan': '#00f3ff',
                'brand-cyan-light': '#33f6ff',
                'neon-cyan': '#00f3ff',
                'neon-amber': '#ffaa00',
                'glass-black': 'rgba(5, 5, 5, 0.7)',
                'glass-white': 'rgba(255, 255, 255, 0.05)',
            },
            fontFamily: {
                sans: ['Orbitron', 'sans-serif'],
                mono: ['Share Tech Mono', 'monospace'],
            },
            boxShadow: {
                'glow-cyan': '0 0 20px rgba(0, 243, 255, 0.5), 0 0 10px rgba(0, 243, 255, 0.3)',
                'glow-amber': '0 0 20px rgba(255, 170, 0, 0.5), 0 0 10px rgba(255, 170, 0, 0.3)',
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                'glass-premium': '0 0 50px -12px rgba(0, 0, 0, 0.5)',
            },
            backgroundImage: {
                'cyber-grid': "radial-gradient(circle, rgba(0, 243, 255, 0.1) 1px, transparent 1px)",
            },
            backgroundSize: {
                'grid-sm': '20px 20px',
            },
            animation: {
                'scanline': 'scanline 2s linear infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                scanline: {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(100%)' },
                }
            }
        },
    },
    plugins: [],
}
