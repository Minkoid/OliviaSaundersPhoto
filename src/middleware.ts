import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth/auth.config';

/**
 * Edge middleware — a first line of defence for protected areas.
 *
 * Uses the edge-safe Auth.js config (JWT session, no DB/bcrypt) to read the
 * session. This is a coarse gate; every server action, route handler and page
 * still performs its own authoritative authorisation check (defence in depth).
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const role = session?.user?.role;
  const path = nextUrl.pathname;

  const isAdminArea = path.startsWith('/admin');
  const isClientArea = path.startsWith('/account') || path.startsWith('/gallery');

  if (!isAdminArea && !isClientArea) return NextResponse.next();

  if (!session) {
    const loginUrl = new URL('/login', nextUrl);
    loginUrl.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminArea && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Run on protected areas only; static assets and public pages are untouched.
  matcher: ['/admin/:path*', '/account/:path*', '/gallery/:path*'],
};
