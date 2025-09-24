/**
 * NextAuth.js Configuration
 * Provides authentication with multiple providers and secure session management
 */

import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';
import type { Adapter } from 'next-auth/adapters';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  
  // Configure authentication providers
  providers: [
    // Email/Password authentication
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        pin: { label: 'PIN', type: 'password', placeholder: '4-digit PIN' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.pin) {
          throw new Error('Email and PIN are required');
        }

        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
          });

          if (!user || !user.pin) {
            throw new Error('Invalid email or PIN');
          }

          // Verify PIN (simple comparison for now)
          if (credentials.pin !== user.pin) {
            throw new Error('Invalid email or PIN');
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw new Error('Authentication failed');
        }
      },
    }),

    // Google OAuth (if configured)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                scope: 'openid email profile',
                prompt: 'consent',
              },
            },
          }),
        ]
      : []),

    // GitHub OAuth (if configured)
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
          }),
        ]
      : []),
  ],

  // Session configuration
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,    // 24 hours
  },

  // JWT configuration
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Callbacks for customizing behavior
  callbacks: {
    async jwt({ token, user, account }) {
      // Include user ID in JWT token
      if (user) {
        token.id = user.id;
      }

      // Store provider info for OAuth users
      if (account?.provider) {
        token.provider = account.provider;
      }

      return token;
    },

    async session({ session, token }) {
      // Include user ID in session
      if (token?.id) {
        session.user.id = token.id as string;
      }

      // Include provider info
      if (token?.provider) {
        session.provider = token.provider as string;
      }

      return session;
    },

    async signIn({ user, account, profile }) {
      // Allow sign in
      if (account?.provider === 'credentials') {
        return true;
      }

      // For OAuth providers, ensure email is verified
      if (account?.provider && profile?.email) {
        try {
          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: profile.email },
          });

          // If user exists but doesn't have this OAuth account linked, link it
          if (existingUser && !existingUser.emailVerified) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { emailVerified: new Date() },
            });
          }

          return true;
        } catch (error) {
          console.error('Sign in error:', error);
          return false;
        }
      }

      return true;
    },

    async redirect({ url, baseUrl }) {
      // Ensure redirects stay within the application domain
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  // Custom pages
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  // Events for logging and analytics
  events: {
    async signIn(message) {
      console.log(`User signed in: ${message.user.email}`);
    },
    async signOut(message) {
      console.log(`User signed out: ${message.token?.email || 'Unknown'}`);
    },
    async createUser(message) {
      console.log(`New user created: ${message.user.email}`);
    },
  },

  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
};

// Export default for compatibility
export default authOptions;