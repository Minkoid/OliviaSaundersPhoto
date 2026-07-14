import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from './password';
import { authConfig } from './auth.config';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * Full Auth.js instance (Node runtime). Adds the Credentials provider with
 * secure password verification.
 *
 * Anti-enumeration: on any failure — unknown user, disabled account, or bad
 * password — we return null (a generic "invalid credentials" outcome) and still
 * perform a hash comparison against a dummy value to keep timing consistent.
 */
const DUMMY_HASH = '$2a$12$abcdefghijklmnopqrstuuWZ1Q9mE1s3n1nZ1pO0oQ0oQ0oQ0oQ0o';

export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user || !user.passwordHash || !user.isActive || user.deletedAt) {
          // Keep timing consistent to avoid user enumeration via response time.
          await verifyPassword(password, DUMMY_HASH);
          return null;
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
        };
      },
    }),
  ],
});
