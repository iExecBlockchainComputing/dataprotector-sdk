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
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger))',
          foreground: 'hsl(var(--danger-foreground))',
        },

        /* ---  Custom --- */
        'yellow-200': 'hsl(var(--yellow-200))',
        'grey-100': 'hsl(var(--grey-100))',
        'grey-500': 'hsl(var(--grey-500))',
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
        anybody: [
          `"Anybody Variable", ${defaultTheme.fontFamily.sans.join(',')}`,
          {
            fontVariationSettings: '"wdth" 120',
          },
        ],
        mono: ['"Space Mono"', ...defaultTheme.fontFamily.mono],
        grotesk: ['"Space Grotesk"', ...defaultTheme.fontFamily.mono],
      },
      borderRadius: {
        30: '30px',
      },
      dropShadow: {
        'link-hover': '0px 1px 4px rgba(255 255 255 / 0.8)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
