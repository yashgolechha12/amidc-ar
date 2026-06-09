import type { Config } from 'tailwindcss';
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0b0f14',
        surface: '#161d2b',
        teal: '#00b49a',
        red: { DEFAULT: '#f87171' },
        amber: { DEFAULT: '#fbbf24' },
        green: { DEFAULT: '#34d399' },
        blue: { DEFAULT: '#60a5fa' },
        purple: '#a78bfa',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
