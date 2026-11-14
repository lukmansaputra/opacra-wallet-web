/** Tailwind v3 — tema dompet kripto Opacra Wallet.
 *  Gaya wallet asli (Phantom / Trust Wallet): latar near-black datar,
 *  permukaan #12161C, border 1px putih 5%, SATU aksen emerald yang dipakai
 *  hemat (tombol utama + angka saldo). Tanpa glow, tanpa gradasi besar. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B0E11',
        pine: '#0E1216',
        moss: '#12161C',
        card: '#12161C',
        card2: '#171D24',
        line: '#1E242C',
        line2: '#2A313B',
        text: '#F2F4F7',
        muted: '#8B95A5',
        accent: '#22C55E',
        accentdeep: '#16A34A',
        accentsoft: '#14532D',
        danger: '#EF4444',
        warn: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
};
