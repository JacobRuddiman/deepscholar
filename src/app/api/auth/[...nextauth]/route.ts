// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { DefaultSession } from "next-auth";

import { prisma } from "@/lib/prisma";

// Access environment variables directly
const googleClientId = process.env.AUTH_GOOGLE_ID || "";
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET || "";
const discordClientId = process.env.AUTH_DISCORD_ID || "";
const discordClientSecret = process.env.AUTH_DISCORD_SECRET || "";

// Type augmentation for adding id to session user
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
    DiscordProvider({
      clientId: discordClientId,
      clientSecret: discordClientSecret,
    }),
  ],
  session: {
    strategy: "jwt", // Change to "database" if you want database sessions
  },
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    redirect({ url, baseUrl }) {
      // If the URL is relative to the site or starts with the base URL
      if (url.startsWith('/') || url.startsWith(baseUrl)) {
        return url;
      }
      // Otherwise, redirect to homepage 
      return '/home';
    },
  },
  pages: {
    signIn: "auth/signin",
    error: "auth/signin", // Redirect to sign-in page if there's an error
  },
  debug: process.env.NODE_ENV === "development",
});

// For API Route handler
export const GET = handlers.GET;
export const POST = handlers.POST;