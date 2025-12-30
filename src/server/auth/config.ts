import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";

import { db } from "@/server/db";
import { isLocalAuth, getLocalSession } from "@/lib/localMode";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      isAdmin?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    isAdmin?: boolean;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: isLocalAuth()
    ? [] // No providers in local auth mode
    : [
        DiscordProvider,
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID ?? "",
          clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        }),
        /**
         * ...add more providers here.
         *
         * Most other providers require a bit more work than the Discord provider. For example, the
         * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
         * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
         *
         * @see https://next-auth.js.org/providers/github
         */
      ],
  adapter: isLocalAuth() ? undefined : PrismaAdapter(db),
  // SECURITY: Reduced session lifetime from 30 days to 14 days
  // Aligns with NIST 800-63B recommendations for session management
  session: {
    strategy: "database" as const,
    maxAge: 14 * 24 * 60 * 60, // 14 days in seconds
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  callbacks: {
    session: ({ session, user }) => {
      // In local auth mode, return the mock session
      if (isLocalAuth()) {
        const localSession = getLocalSession();
        return {
          ...session,
          user: {
            ...localSession?.user,
            id: localSession?.user.id ?? 'demo-user-id',
          },
        };
      }

      // Normal session handling - check if user exists to prevent null payload error
      if (!user) {
        return session;
      }

      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
        },
      };
    },
    authorized: ({ auth, request: { nextUrl } }) => {
      // Always allow in local auth mode
      if (isLocalAuth()) {
        return true;
      }
      
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith('/auth');

      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL('/', nextUrl));
        return true;
      }

      if (!isLoggedIn) return false;

      return true;
    },
  },
} satisfies NextAuthConfig;
