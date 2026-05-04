import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#0a0e17', 900: '#0f1420', 800: '#1a2233', 700: '#26324a' },
        accent: { DEFAULT: '#5eead4', muted: '#2dd4bf', dark: '#14b8a6' },
        chart: {
          profit: '#34d399',
          loss: '#f87171',
          neutral: '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
