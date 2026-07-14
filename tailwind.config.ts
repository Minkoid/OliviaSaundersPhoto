import type { Config } from 'tailwindcss';

/**
 * Design tokens for the Olivia Saunders brand.
 *
 * The palette is deliberately restrained and warm: ivory and parchment grounds,
 * stone neutrals, and heritage accents (olive, burgundy, deep brown). Colours are
 * exposed as CSS custom properties (see globals.css) so they can be themed and so
 * email/OG rendering can reference the same values.
 */
const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/emails/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ivory: 'rgb(var(--color-ivory) / <alpha-value>)',
        parchment: 'rgb(var(--color-parchment) / <alpha-value>)',
        stone: {
          DEFAULT: 'rgb(var(--color-stone) / <alpha-value>)',
          soft: 'rgb(var(--color-stone-soft) / <alpha-value>)',
          deep: 'rgb(var(--color-stone-deep) / <alpha-value>)',
        },
        charcoal: 'rgb(var(--color-charcoal) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        olive: 'rgb(var(--color-olive) / <alpha-value>)',
        burgundy: 'rgb(var(--color-burgundy) / <alpha-value>)',
        umber: 'rgb(var(--color-umber) / <alpha-value>)',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: [
          'var(--font-sans)',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        // Editorial display sizes with tight, refined tracking.
        'display-xl': ['clamp(3rem, 6vw, 5.5rem)', { lineHeight: '1.02', letterSpacing: '-0.02em' }],
        'display-lg': ['clamp(2.5rem, 4.5vw, 4rem)', { lineHeight: '1.05', letterSpacing: '-0.015em' }],
        'display-md': ['clamp(2rem, 3.2vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        eyebrow: ['0.75rem', { lineHeight: '1.2', letterSpacing: '0.22em' }],
      },
      letterSpacing: {
        widest: '0.24em',
      },
      maxWidth: {
        prose: '68ch',
        measure: '58ch',
        shell: '90rem',
      },
      spacing: {
        section: 'clamp(4rem, 9vw, 9rem)',
        gutter: 'clamp(1.25rem, 4vw, 3.5rem)',
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        400: '400ms',
        600: '600ms',
      },
      borderColor: {
        hairline: 'rgb(var(--color-ink) / 0.12)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.6s var(--ease-editorial) both',
        'fade-up': 'fade-up 0.7s var(--ease-editorial) both',
      },
    },
  },
  plugins: [],
};

export default config;
