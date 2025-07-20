import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    NEXTAUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    NEXTAUTH_URL: z.preprocess(
      // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
      // Since NextAuth.js automatically uses the VERCEL_URL if present.
      (str) => process.env.VERCEL_URL ?? str,
      // VERCEL_URL doesn't include `https` so it cant be validated as a URL
      process.env.VERCEL ? z.string() : z.string().url()
    ),
    
    // Sentry
    SENTRY_DSN: z.string().optional(),
    SENTRY_ENVIRONMENT: z.string().default("development"),
    
    // ANDI Services
    CLICKHOUSE_URL: z.string().url().optional(),
    AIRFLOW_API_URL: z.string().url().optional(),
    
    // AI Orchestration
    ASSEMBLY_AI_API_KEY: z.string().optional(),
    ASSEMBLY_AI_WEBHOOK_URL: z.string().url().optional(),
    OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
    OLLAMA_CIQ_MODEL: z.string().default("andi-ciq-analyzer"),
    OLLAMA_COACH_MODEL: z.string().default("andi-coach"),
    OLLAMA_REALTIME_MODEL: z.string().default("andi-realtime"),
    REDIS_URL: z.string().default("redis://localhost:6379"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: z.string().default("development"),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    
    // Sentry
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT,
    
    // ANDI Services
    CLICKHOUSE_URL: process.env.CLICKHOUSE_URL,
    AIRFLOW_API_URL: process.env.AIRFLOW_API_URL,
    
    // AI Orchestration
    ASSEMBLY_AI_API_KEY: process.env.ASSEMBLY_AI_API_KEY,
    ASSEMBLY_AI_WEBHOOK_URL: process.env.ASSEMBLY_AI_WEBHOOK_URL,
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
    OLLAMA_CIQ_MODEL: process.env.OLLAMA_CIQ_MODEL,
    OLLAMA_COACH_MODEL: process.env.OLLAMA_COACH_MODEL,
    OLLAMA_REALTIME_MODEL: process.env.OLLAMA_REALTIME_MODEL,
    REDIS_URL: process.env.REDIS_URL,
    
    // Client
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  },
  /**
   * Run `build` or `dev` with SKIP_ENV_VALIDATION to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});