/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Follows the device setting (no in-app toggle); a host can force a theme with data-theme on <html>.
  darkMode: ['variant', ['@media (prefers-color-scheme: dark) { &:not(:where([data-theme=light], [data-theme=light] *)) }', '&:where([data-theme=dark], [data-theme=dark] *)']],
  theme: {
    extend: {
      colors: {
        brand: { yellow: '#fed925', black: '#0a0a0a' },
      },
      fontFamily: {
        sans: ['Gilroy', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      spacing: {
        'safe-b': 'env(safe-area-inset-bottom)',
        'safe-t': 'env(safe-area-inset-top)',
      },
      minHeight: { touch: '44px' },
      minWidth: { touch: '44px' },
    },
  },
  plugins: [],
};
