import { auth } from "~/server/auth"
import { redirect } from "next/navigation"

export async function checkOnboardingCompletion() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { needsAuth: true }
  }

  // TODO: Check if user has completed onboarding by querying teacher_profiles table
  // For now, always redirect to onboarding (this would be replaced with actual DB check)
  const hasCompletedOnboarding = false // await checkTeacherProfileExists(session.user.id)
  
  return { 
    needsAuth: false, 
    needsOnboarding: !hasCompletedOnboarding,
    user: session.user 
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