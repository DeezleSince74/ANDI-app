import NextAuth from "next-auth"
import { authConfig } from "~/lib/auth"

const { handlers, auth: nextAuthAuth, signIn, signOut } = NextAuth(authConfig)

// Wrap auth function with logging
export const auth = async () => {
  console.log('🔑 [NEXTAUTH] Starting session check')
  
  try {
    const session = await nextAuthAuth()
    
    if (session) {
      console.log('✅ [NEXTAUTH] Session found:', {
        userId: session.user?.id,
        email: session.user?.email,
        expires: session.expires
      })
    } else {
      console.log('❌ [NEXTAUTH] No session found')
    }
    
    return session
  } catch (error) {
    console.error('💥 [NEXTAUTH] Error during session check:', error)
    return null
  }
}

export { handlers, signIn, signOut }