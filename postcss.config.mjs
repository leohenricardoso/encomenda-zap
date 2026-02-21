// Tailwind v4 uses @tailwindcss/postcss instead of the old tailwindcss plugin.
// No tailwind.config.js needed — configuration lives in globals.css via @theme.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
