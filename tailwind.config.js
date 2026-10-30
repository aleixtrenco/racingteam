/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Follows the device setting (no in-app toggle); a host can force a theme with data-theme on <html>.
  darkMode: ['variant', ['@media (prefers-color-scheme: dark) { &:not(:where([data-theme=light], [data-theme=light] *)) }', '&:where([data-theme=dark], [data-theme=dark] *)']],
  theme: {
    extend: {
      colors: {
        brand: { yellow: '#fed925', black: '#0b0b0c' },
        paper: '#f4f4f1',
      },
      fontFamily: {
        // Gilroy is the brand face; Outfit (Google Fonts) stands in until the licensed files are added.
        sans: ['Gilroy', 'Outfit', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      spacing: {
        'safe-b': 'env(safe-area-inset-bottom)',
        'safe-t': 'env(safe-area-inset-top)',
      },
      minHeight: { touch: '44px' },
      boxShadow: { lift: '0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -12px rgb(0 0 0 / 0.18)' },
      minWidth: { touch: '44px' },
    },
  },
  plugins: [],
};
