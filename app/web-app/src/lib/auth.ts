import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { type NextAuthConfig } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";

import { db } from "~/server/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "~/server/db/schema";

export const authConfig = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          // TODO: Change to "select_account" or remove entirely for production
          // "consent" forces OAuth screen every time - good for testing, bad UX for production
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM ?? "noreply@andilabs.ai",
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  session: {
    strategy: "database" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
        role: user.role,
        schoolId: user.schoolId,
        districtId: user.districtId,
        gradeLevels: user.gradeLevels,
        subjects: user.subjects,
        yearsExperience: user.yearsExperience,
        certificationLevel: user.certificationLevel,
      },
    }),
  },
  events: {
    async createUser({ user }) {
      console.log("New user created:", user.email);
    },
    async signIn({ user, account }) {
      console.log("User signed in:", user.email, "Provider:", account?.provider);
    },
  },
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(error) {
      console.error('[AUTH ERROR]', error)
    },
    warn(code) {
      console.warn('[AUTH WARN]', code)
    },
    debug(code, metadata) {
      console.log('[AUTH DEBUG]', code, metadata)
    }
  },
} satisfies NextAuthConfig;