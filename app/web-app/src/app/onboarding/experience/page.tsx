"use client"

import { useState, useEffect } from "react"
import { useOnboarding } from "@/lib/onboarding-context"
import { NavigationButtons } from "@/components/onboarding/navigation-buttons"
import { getOnboardingInstructions } from "@/lib/onboarding-data"
import { Button } from "@/components/ui/button"
import { Minus, Plus } from "lucide-react"

export default function ExperiencePage() {
  const { data, updateData } = useOnboarding()
  const [years, setYears] = useState<number>(data.yearsExperience)
  const [instructions, setInstructions] = useState<{ main: string; subtitle?: string; helper?: string }>({ main: '' })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const instructionData = await getOnboardingInstructions('teaching_experience')
      setInstructions(instructionData)
      setIsLoading(false)
    }
    loadData()
  }, [])

  const handleNext = () => {
    updateData({ yearsExperience: years })
  }

  const increment = () => {
    if (years < 50) {
      setYears(years + 1)
    }
  }

  const decrement = () => {
    if (years > 0) {
      setYears(years - 1)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        {instructions.main}
      </h1>
      {instructions.subtitle && (
        <p className="text-slate-600 mb-8">
          {instructions.subtitle}
        </p>
      )}

      <div className="flex justify-center items-center space-x-6 my-16">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={decrement}
          disabled={years === 0}
          className="h-12 w-12 rounded-full"
          data-testid="decrement-button"
        >
          <Minus className="h-5 w-5" />
        </Button>

        <div className="text-center">
          <div className="text-6xl font-bold text-slate-700 mb-2" data-testid="years-display">
            {years}
          </div>
          <p className="text-slate-600">
            {years === 1 ? 'year' : 'years'}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={increment}
          disabled={years === 50}
          className="h-12 w-12 rounded-full"
          data-testid="increment-button"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      <NavigationButtons
        onNext={handleNext}
        nextPath="/onboarding/subjects"
        backPath="/onboarding/grade-levels"
      />
    </div>
  )
}