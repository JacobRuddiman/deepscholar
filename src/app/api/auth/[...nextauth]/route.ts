// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import DiscordProvider from "next-auth/providers/discord"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { DefaultSession } from "next-auth";

import { db } from "@/server/db"

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
  adapter: PrismaAdapter(db),
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
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    // Add this redirect callback
    redirect({ url, baseUrl }) {
      // If the URL is relative to the site (starts with /) or
      // is a full URL that starts with the base URL of your site
      if (url.startsWith('/') || url.startsWith(baseUrl)) {
        return url;
      }
      // Otherwise, redirect to homepage or dashboard
      return '/home';
    },
  },
  pages: {
    signIn: "/signin",
  },
})

// For API Route handler
export const GET = handlers.GET;
export const POST = handlers.POST;