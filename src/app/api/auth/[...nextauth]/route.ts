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
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (!user.email) {
        return false;
      }

      // Allow sign in if user exists with this email
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
        include: { accounts: true },
      });

      if (existingUser) {
        // If user exists but doesn't have this provider's account, link it
        const hasProviderAccount = existingUser.accounts.some(
          (acc) => acc.provider === account?.provider
        );

        if (!hasProviderAccount && account) {
          await prisma.account.create({
            data: {
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              expires_at: account.expires_at,
            },
          });
        }
        return true;
      }

      // If user doesn't exist, create them
      await prisma.user.create({
        data: {
          id: user.id,
          name: user.name || "",
          email: user.email,
          image: user.image || "",
        },
      });

      return true;
    },
    redirect({ url, baseUrl }) {
      if (url.startsWith('/') || url.startsWith(baseUrl)) {
        return url;
      }
      return '/home';
    },
  },
  pages: {
    signIn: "auth/signin",
    error: "auth/signin",
  },
  debug: process.env.NODE_ENV === "development",
});

// For API Route handler
export const GET = handlers.GET;
export const POST = handlers.POST;