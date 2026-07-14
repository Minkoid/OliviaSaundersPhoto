import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'ADMIN' | 'CLIENT';
      isActive: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    role?: 'ADMIN' | 'CLIENT';
    isActive?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: 'ADMIN' | 'CLIENT';
    isActive?: boolean;
  }
}
