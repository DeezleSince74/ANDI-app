"use client"

import { ReactNode, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Card } from "@/components/ui/card"
import { OnboardingProvider, useOnboarding } from "@/lib/onboarding-context"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface OnboardingLayoutProps {
  children: ReactNode
}

const ONBOARDING_STEPS = [
  { path: "/onboarding/grade-levels", step: 1 },
  { path: "/onboarding/experience", step: 2 },
  { path: "/onboarding/subjects", step: 3 },
  { path: "/onboarding/teaching-styles", step: 4 },
  { path: "/onboarding/interests", step: 5 },
  { path: "/onboarding/strengths", step: 6 },
  { path: "/onboarding/goals", step: 7 },
  { path: "/onboarding/photo-upload", step: 8 },
  { path: "/onboarding/voice-intro", step: 9 },
  { path: "/onboarding/voice-recording", step: 10 },
]

const TOTAL_STEPS = 10

function OnboardingContent({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { data: onboardingData } = useOnboarding()
  
  const currentStep = ONBOARDING_STEPS.find(s => s.path === pathname)?.step || 1

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Mock teacher data for development - replace with real session data when auth is fully implemented
  const mockTeacher = {
    name: "Sarah Johnson",
    email: "sarah.johnson@school.edu",
    image: null // Will use initials fallback
  }

  // Use mock data if no session available, otherwise use session data
  const teacher = session?.user || mockTeacher
  
  // Use onboarding avatar if available, otherwise fall back to session/mock image
  const avatarUrl = onboardingData.avatarUrl || teacher?.image

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-sm shadow-2xl border-slate-200">
        <div className="p-8">
          {/* User Info */}
          <div className="flex items-center justify-center mb-6">
            <Avatar className="h-12 w-12 mr-3">
              <AvatarImage src={avatarUrl || undefined} alt={teacher?.name || "Teacher"} />
              <AvatarFallback>
                {teacher?.name ? getInitials(teacher.name) : "T"}
              </AvatarFallback>
            </Avatar>
            <p className="font-medium text-slate-900">
              {teacher?.name || "Teacher"}
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8" data-testid="progress-indicator">
            <div className="flex justify-center items-center space-x-2">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <div
                  key={i}
                  data-testid="progress-dot"
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    i + 1 <= currentStep
                      ? "bg-slate-600 w-8"
                      : "bg-slate-300"
                  }`}
                />
              ))}
            </div>
            <p className="text-center text-sm text-slate-600 mt-2">
              Step {currentStep} of {TOTAL_STEPS}
            </p>
          </div>

          {/* Content */}
          {children}
        </div>
      </Card>
    </div>
  )
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <OnboardingProvider>
      <OnboardingContent>
        {children}
      </OnboardingContent>
    </OnboardingProvider>
  )
}