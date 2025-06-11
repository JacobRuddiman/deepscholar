// src/env.mjs or env.mjs (depending on your project structure)
import { z } from "zod";

// Check if we're in local mode
const isLocalMode = process.env.NEXT_PUBLIC_LOCAL_MODE === 'true';

// Define your environment variables schema
const server = z.object({
  DATABASE_URL: isLocalMode 
    ? z.string().optional().default("file:./dev.db")
    : z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]),
  NEXTAUTH_SECRET: isLocalMode 
    ? z.string().optional().default("local-dev-secret-key-for-development-only")
    : z.string().min(1),
  NEXTAUTH_URL: z.preprocess(
    (str) => process.env.VERCEL_URL ?? str,
    isLocalMode 
      ? z.string().optional().default("http://localhost:3000")
      : process.env.VERCEL ? z.string().min(1) : z.string().url(),
  ),
  GOOGLE_CLIENT_ID: isLocalMode 
    ? z.string().optional().default("local-mock-client-id")
    : z.string().min(1),
  GOOGLE_CLIENT_SECRET: isLocalMode 
    ? z.string().optional().default("local-mock-client-secret")
    : z.string().min(1),
  // Add local mode flag to server env
  NEXT_PUBLIC_LOCAL_MODE: z.string().optional(),
});

// Client-side variables (if any)
const client = z.object({
  NEXT_PUBLIC_LOCAL_MODE: z.string().optional(),
});

// Process environment variables
const processEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  NEXT_PUBLIC_LOCAL_MODE: process.env.NEXT_PUBLIC_LOCAL_MODE,
};

// Validate environment variables
const env = server.safeParse(processEnv);

if (!env.success) {
  if (isLocalMode) {
    console.warn(
      "⚠️  Some environment variables are missing, but LOCAL_MODE is enabled. Using defaults:",
      env.error.format()
    );
    // In local mode, we'll use the defaults defined in the schema
  } else {
    console.error(
      "❌ Invalid environment variables:",
      env.error.format()
    );
    throw new Error("Invalid environment variables");
  }
}

// Export the validated environment variables or defaults for local mode
export const envVars = env.success ? env.data : {
  DATABASE_URL: "file:./dev.db",
  NODE_ENV: process.env.NODE_ENV || "development",
  NEXTAUTH_SECRET: "local-dev-secret-key-for-development-only",
  NEXTAUTH_URL: "http://localhost:3000",
  GOOGLE_CLIENT_ID: "local-mock-client-id",
  GOOGLE_CLIENT_SECRET: "local-mock-client-secret",
  NEXT_PUBLIC_LOCAL_MODE: process.env.NEXT_PUBLIC_LOCAL_MODE,
};

// Log the current mode
if (isLocalMode) {
  console.log("🔧 Running in LOCAL MODE - using mock data and local database");
} else {
  console.log("🌐 Running in PRODUCTION MODE - using external services");
}
