/** Tailwind v3 — tema dompet kripto gelap Opacra Wallet (EasyUI). */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#070b09',
        pine: '#0b100d',
        moss: '#101712',
        card: '#121a15',
        card2: '#1a241d',
        line: '#223028',
        line2: '#2e4036',
        text: '#e8edf3',
        muted: '#9aa7b8',
        accent: '#22c55e',
        accentdeep: '#16a34a',
        accentsoft: '#14532d',
        sky: '#38bdf8',
        danger: '#ef4444',
        warn: '#f59e0b',
        gold: '#fbbf24',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(34, 197, 94, 0.45)',
        card: '0 10px 30px -12px rgba(0, 0, 0, 0.6)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
