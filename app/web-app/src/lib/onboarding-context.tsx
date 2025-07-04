"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface OnboardingData {
  gradeLevels: string[]
  yearsExperience: number
  subjects: string[]
  teachingStyles: string[]
  interests: string[]
  strengths: string[]
  goals: string[]
  voiceSampleUrl?: string
  avatarUrl?: string
}

interface OnboardingContextType {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  resetData: () => void
}

const defaultData: OnboardingData = {
  gradeLevels: [],
  yearsExperience: 0,
  subjects: [],
  teachingStyles: [],
  interests: [],
  strengths: [],
  goals: [],
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaultData)

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const resetData = () => {
    setData(defaultData)
  }

  return (
    <OnboardingContext.Provider value={{ data, updateData, resetData }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider")
  }
  return context
}