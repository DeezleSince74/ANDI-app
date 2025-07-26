import { redirect } from "next/navigation"
import { auth } from "~/server/auth"
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar"
import { AppSidebar } from "~/components/app-sidebar"
import { AppHeader } from "~/components/app-header"
import { redirectToOnboardingIfNeeded } from "~/lib/onboarding-check"
import { SessionProvider } from "next-auth/react"
import { RecordingProvider } from "~/lib/recording-context"
import { Toaster } from "sonner"
import { initializeRealtimeSystem } from "~/lib/realtime-startup"

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log('🔒 [AUTH-LAYOUT] Starting authentication check')
  
  const session = await auth()
  
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
  
  // Initialize real-time system (PostgreSQL listener + WebSocket)
  console.log('🔄 [AUTH-LAYOUT] Initializing real-time system')
  await initializeRealtimeSystem()
  
  console.log('🎉 [AUTH-LAYOUT] Authentication successful, rendering layout')

  return (
    <SessionProvider session={session}>
      <RecordingProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <AppHeader />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: 'white',
              color: '#1e293b',
              border: '1px solid #e2e8f0',
            },
          }}
        />
      </RecordingProvider>
    </SessionProvider>
  )
}