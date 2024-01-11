import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },

        /* ---  Custom --- */
        'grey-100': 'hsl(var(--grey-100))',
        'grey-700': 'hsl(var(--grey-700))',
        'grey-800': 'hsl(var(--grey-800))',
        'grey-900': 'hsl(var(--grey-900))',
      },
      borderColor: {
        button: 'hsl(var(--button))',
      },
      ringColor: {
        ring: 'hsl(var(--ring))',
      },
      fontFamily: {
        sans: ['"Mulish"', ...defaultTheme.fontFamily.sans],
        anybody: ['"Anybody"', ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        '30': '30px',
      }
    },
  },
  plugins: [],
};
