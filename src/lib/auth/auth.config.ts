import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe Auth.js configuration.
 *
 * This file must NOT import Node-only modules (bcrypt, Prisma) so it can run in
 * the middleware/edge runtime. The Credentials provider and database lookups are
 * added in `index.ts`, which runs in the Node runtime only.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 }, // 7 days
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // `role` and `isActive` are attached in the Credentials authorize().
        token.role = (user as { role?: string }).role ?? 'CLIENT';
        token.isActive = (user as { isActive?: boolean }).isActive ?? true;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as 'ADMIN' | 'CLIENT') ?? 'CLIENT';
        session.user.isActive = (token.isActive as boolean) ?? true;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
