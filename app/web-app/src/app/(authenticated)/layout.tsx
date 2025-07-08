import { redirect } from "next/navigation"
import { auth } from "~/server/auth"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { AppSidebar } from "~/components/app-sidebar"
import { AppHeader } from "~/components/app-header"
import { redirectToOnboardingIfNeeded } from "~/lib/onboarding-check"
import { SessionProvider } from "next-auth/react"

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log('🔒 [AUTH-LAYOUT] Starting authentication check')
  
  const session = await auth()
  
  // Development bypass: Check for a special cookie that indicates dev login
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (!session && isDevelopment) {
    console.log('🧪 [AUTH-LAYOUT] No session in development, creating mock session')
    // Create a mock session for development
    const mockSession = {
      user: {
        id: "550e8400-e29b-41d4-a716-446655440011",
        email: "david.thompson@mcps.edu",
        name: "David Thompson",
        image: null,
        role: "teacher",
        schoolId: "550e8400-e29b-41d4-a716-446655440002",
        districtId: "550e8400-e29b-41d4-a716-446655440001",
        gradeLevels: ["9", "10", "11", "12"],
        subjects: ["Mathematics", "Statistics"],
        yearsExperience: 8,
        certificationLevel: "Professional"
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
    
    console.log('🎭 [AUTH-LAYOUT] Using mock session for David Thompson')
    
    return (
      <SessionProvider session={mockSession}>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <AppHeader />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </SessionProvider>
    )
  }
  
  if (!session) {
    console.log('❌ [AUTH-LAYOUT] No session found, redirecting to signin')
    redirect("/auth/signin")
  }
  
  console.log('✅ [AUTH-LAYOUT] Session found for user:', session.user?.email)
  console.log('📋 [AUTH-LAYOUT] Session details:', {
    userId: session.user?.id,
    email: session.user?.email,
    expires: session.expires
  })
  
  // Check if user needs onboarding
  console.log('🎯 [AUTH-LAYOUT] Checking onboarding requirements')
  await redirectToOnboardingIfNeeded()
  
  console.log('🎉 [AUTH-LAYOUT] Authentication successful, rendering layout')

  return (
    <SessionProvider session={session}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  )
}