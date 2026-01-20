/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/app/**/*.{js,ts,jsx,tsx}",
        "./src/components/**/*.{js,ts,jsx,tsx}",
        "./src/contexts/**/*.{js,ts,jsx,tsx}",
        "./src/services/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'brand-black': '#050505',
                'deep-space': '#0a0a12',
                'brand-cyan': '#00f3ff',
                'brand-cyan-light': '#80f9ff',
                'brand-cyan-dark': '#00a8b0',
                'neon-cyan': '#00f3ff',
                'neon-purple': '#bc13fe',
                'neon-amber': '#ffaa00',
                'neon-green': '#00ff9d',
                'glass-black': 'rgba(0, 0, 0, 0.7)',
                'glass-dark': 'rgba(10, 10, 20, 0.6)',
                'glass-white': 'rgba(255, 255, 255, 0.05)',
            },
            fontFamily: {
                sans: ['Orbitron', 'sans-serif'],
                mono: ['Share Tech Mono', 'monospace'],
            },
            boxShadow: {
                'glow-cyan': '0 0 20px rgba(0, 243, 255, 0.4), 0 0 10px rgba(0, 243, 255, 0.2)',
                'glow-purple': '0 0 20px rgba(188, 19, 254, 0.4), 0 0 10px rgba(188, 19, 254, 0.2)',
                'glow-amber': '0 0 20px rgba(255, 170, 0, 0.4), 0 0 10px rgba(255, 170, 0, 0.2)',
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
                'glass-premium': '0 0 50px -12px rgba(0, 243, 255, 0.1)',
                'inset-glow': 'inset 0 0 20px rgba(0, 243, 255, 0.05)',
            },
            backgroundImage: {
                'cyber-grid': "radial-gradient(circle, rgba(0, 243, 255, 0.1) 1px, transparent 1px)",
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
            },
            backgroundSize: {
                'grid-sm': '20px 20px',
            },
            animation: {
                'scanline': 'scanline 3s linear infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'slide-up': 'slideUp 0.5s ease-out forwards',
            },
            keyframes: {
                scanline: {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(100%)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                }
            }
        },
    },
    plugins: [],
}
