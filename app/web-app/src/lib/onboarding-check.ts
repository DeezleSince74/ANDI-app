import { auth } from "~/server/auth"
import { redirect } from "next/navigation"
import { checkOnboardingCompletion as dbCheckOnboardingCompletion } from "~/server/db/onboarding"

export async function checkOnboardingCompletion() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { needsAuth: true }
  }

  try {
    const hasCompletedOnboarding = await dbCheckOnboardingCompletion(session.user.id)
    
    return { 
      needsAuth: false, 
      needsOnboarding: !hasCompletedOnboarding,
      user: session.user 
    }
  } catch (error) {
    console.error("Error checking onboarding completion:", error)
    // Default to requiring onboarding if there's an error
    return { 
      needsAuth: false, 
      needsOnboarding: true,
      user: session.user 
    }
  }
}

// Utility function to redirect to onboarding if needed
export async function redirectToOnboardingIfNeeded() {
  const { needsAuth, needsOnboarding } = await checkOnboardingCompletion()
  
  if (needsAuth) {
    redirect("/auth/signin")
  }
  
  if (needsOnboarding) {
    redirect("/onboarding/grade-levels")
  }
}