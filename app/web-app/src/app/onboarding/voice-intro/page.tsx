"use client"

import { useState, useEffect } from "react"
import { NavigationButtons } from "@/components/onboarding/navigation-buttons"
import { getOnboardingInstructions } from "@/lib/onboarding-data"
import { Button } from "@/components/ui/button"
import { Mic } from "lucide-react"
import { useRouter } from "next/navigation"

export default function VoiceIntroPage() {
  const router = useRouter()
  const [instructions, setInstructions] = useState<{ main: string; subtitle?: string; helper?: string }>({ main: '' })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const instructionData = await getOnboardingInstructions('voice_sample_intro')
      setInstructions(instructionData)
      setIsLoading(false)
    }
    loadData()
  }, [])

  const handleSetupLater = async () => {
    // TODO: Call API to save progress and skip voice recording
    router.push('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
          <Mic className="w-10 h-10 text-slate-600" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-4">
        {instructions.main}
      </h1>
      {instructions.subtitle && (
        <p className="text-slate-600 mb-6 max-w-lg mx-auto">
          {instructions.subtitle}
        </p>
      )}
      {instructions.helper && (
        <p className="text-sm text-slate-500 mb-8">
          {instructions.helper}
        </p>
      )}

      <div className="mb-8">
        <h3 className="font-medium text-slate-900 mb-3">
          You'll be asked to read 3 short phrases:
        </h3>
        <ol className="text-left max-w-md mx-auto space-y-2 text-slate-600">
          <li>1. A greeting to start your class</li>
          <li>2. Instructions for classroom management</li>
          <li>3. Positive feedback for your students</li>
        </ol>
      </div>

      <Button
        variant="link"
        onClick={handleSetupLater}
        className="text-slate-500 hover:text-slate-700 mb-8"
      >
        Set up later
      </Button>

      <NavigationButtons
        nextPath="/onboarding/voice-recording"
        backPath="/onboarding/photo-upload"
        nextLabel="Start Recording"
      />
    </div>
  )
}