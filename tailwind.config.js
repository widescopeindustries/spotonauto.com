/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/contexts/**/*.{js,ts,jsx,tsx}",
    "./src/services/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Legacy colors for backward compatibility
        'brand-black': '#050505',
        'deep-space': '#0a0a12',
        'brand-cyan': '#00d4ff',
        'brand-cyan-light': '#80f9ff',
        'brand-cyan-dark': '#00a8b0',
        'neon-cyan': '#00d4ff',
        'neon-purple': '#bc13fe',
        'neon-amber': '#ffaa00',
        'neon-green': '#00ff9d',
        'glass-black': 'rgba(0, 0, 0, 0.7)',
        'glass-dark': 'rgba(10, 10, 20, 0.6)',
        'glass-white': 'rgba(255, 255, 255, 0.05)',
        // New cyan scale
        cyan: {
          DEFAULT: "#00d4ff",
          50: "#e6fbff",
          100: "#ccf7ff",
          200: "#99efff",
          300: "#66e7ff",
          400: "#33dfff",
          500: "#00d4ff",
          600: "#00aacc",
          700: "#007f99",
          800: "#005566",
          900: "#002a33",
        },
        void: "#050505",
        charcoal: "#0a0a0a",
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        body: ["Rajdhani", "sans-serif"],
        ui: ["Inter", "sans-serif"],
        sans: ["Orbitron", "sans-serif"],
        mono: ["Share Tech Mono", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 212, 255, 0.4), 0 0 10px rgba(0, 212, 255, 0.2)',
        'glow-purple': '0 0 20px rgba(188, 19, 254, 0.4), 0 0 10px rgba(188, 19, 254, 0.2)',
        'glow-amber': '0 0 20px rgba(255, 170, 0, 0.4), 0 0 10px rgba(255, 170, 0, 0.2)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
        'glass-premium': '0 0 50px -12px rgba(0, 212, 255, 0.1)',
        'inset-glow': 'inset 0 0 20px rgba(0, 212, 255, 0.05)',
      },
      backgroundImage: {
        'cyber-grid': "radial-gradient(circle, rgba(0, 212, 255, 0.1) 1px, transparent 1px)",
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      backgroundSize: {
        'grid-sm': '20px 20px',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 10px rgba(0, 212, 255, 0.4), 0 0 20px rgba(0, 212, 255, 0.2)",
          },
          "50%": {
            boxShadow: "0 0 20px rgba(0, 212, 255, 0.4), 0 0 40px rgba(0, 212, 255, 0.4)",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "text-flicker": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "text-flicker": "text-flicker 3s ease-in-out infinite",
        'scanline': 'scanline 3s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};
