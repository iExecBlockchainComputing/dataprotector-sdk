import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'hsl(var(--primary))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
      },
      fontFamily: {
        sans: ['"Mulish"', ...defaultTheme.fontFamily.sans],
        anybody: ['"Anybody"', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};
