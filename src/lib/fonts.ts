import { Cormorant_Garamond, Jost } from 'next/font/google';

/**
 * Typography — a high-quality editorial serif for headings and an understated
 * humanist sans for body, labels and navigation. Both are open-source Google
 * fonts (SIL Open Font License), self-hosted at build time by next/font.
 */
export const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-serif',
  display: 'swap',
});

export const sans = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-sans',
  display: 'swap',
});
