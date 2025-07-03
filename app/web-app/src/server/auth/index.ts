import NextAuth, { type DefaultSession } from "next-auth";
import { authConfig } from "~/lib/auth";

/**
 * Module augmentation for Auth.js types
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      schoolId?: string;
      districtId?: string;
      gradeLevels?: string[];
      subjects?: string[];
      yearsExperience?: number;
      certificationLevel?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    schoolId?: string;
    districtId?: string;
    gradeLevels?: string[];
    subjects?: string[];
    yearsExperience?: number;
    certificationLevel?: string;
    preferences?: Record<string, unknown>;
    isActive: boolean;
  }
}

/**
 * Initialize Auth.js configuration
 */
export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig);