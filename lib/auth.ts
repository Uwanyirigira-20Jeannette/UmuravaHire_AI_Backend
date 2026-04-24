import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth — only registered when credentials are present
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId:     process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          await connectDB();
        } catch (err) {
          console.error('[auth] Database connection failed:', err);
          // Throwing here lets NextAuth surface a distinct error code
          throw new Error('DATABASE_ERROR');
        }

        try {
          const user = await User.findOne({ email: credentials.email.toLowerCase() }).lean();
          if (!user || !user.passwordHash) return null;

          const valid = await compare(credentials.password, user.passwordHash);
          if (!valid) return null;

          return {
            id:    (user._id as any).toString(),
            name:  user.name,
            email: user.email,
            image: user.avatar ?? null,
          };
        } catch (err) {
          console.error('[auth] authorize error:', err);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    // Upsert Google users on first sign-in
    async signIn({ account, user }) {
      if (account?.provider === 'google') {
        try {
          await connectDB();
          await User.findOneAndUpdate(
            { email: user.email },
            {
              $setOnInsert: {
                name:     user.name,
                email:    user.email,
                avatar:   user.image,
                provider: 'google',
              },
            },
            { upsert: true, new: true }
          );
        } catch { /* ignore duplicate key on race */ }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },

  pages: {
    signIn:  '/login',
    error:   '/login',
    newUser: '/dashboard',
  },

  session: { strategy: 'jwt' },
  secret:  process.env.NEXTAUTH_SECRET,
};
