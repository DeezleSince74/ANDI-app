import NextAuth from "next-auth"
import { authConfig } from "~/lib/auth"

console.log('🔧 [AUTH] Initializing NextAuth with config...')

const nextAuth = NextAuth(authConfig)

console.log('✅ [AUTH] NextAuth initialized successfully')

export const handlers = nextAuth.handlers
export const auth = nextAuth.auth
export const signIn = nextAuth.signIn
export const signOut = nextAuth.signOut