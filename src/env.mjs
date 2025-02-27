// src/env.mjs or env.mjs (depending on your project structure)
import { z } from "zod";

// Define your environment variables schema
const server = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.preprocess(
    (str) => process.env.VERCEL_URL ?? str,
    process.env.VERCEL ? z.string().min(1) : z.string().url(),
  ),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
});

// Client-side variables (if any)
const client = z.object({
  // Add any public env vars here
});

// Process environment variables
const processEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
};

// Validate environment variables
const env = server.safeParse(processEnv);

if (!env.success) {
  console.error(
    "❌ Invalid environment variables:",
    env.error.format()
  );
  throw new Error("Invalid environment variables");
}

export const envVars = env.data;