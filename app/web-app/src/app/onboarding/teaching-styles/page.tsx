"use client"

import { useState, useEffect } from "react"
import { useOnboarding } from "@/lib/onboarding-context"
import { MultiSelect } from "@/components/onboarding/multi-select"
import { NavigationButtons } from "@/components/onboarding/navigation-buttons"
import { getOnboardingContent, getOnboardingInstructions } from "@/lib/onboarding-data"

export default function TeachingStylesPage() {
  const { data, updateData } = useOnboarding()
  const [selected, setSelected] = useState<string[]>(data.teachingStyles)
  const [options, setOptions] = useState<{ id: string; label: string; description?: string }[]>([])
  const [instructions, setInstructions] = useState<{ main: string; subtitle?: string; helper?: string }>({ main: '' })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const [content, instructionData] = await Promise.all([
        getOnboardingContent('teaching_styles'),
        getOnboardingInstructions('teaching_styles')
      ])
      
      const formattedOptions = content
        .filter(item => item.content_type === 'option' && item.is_active)
        .sort((a, b) => a.display_order - b.display_order)
        .map(item => ({
          id: item.content_key,
          label: item.content_value,
          description: item.metadata?.description
        }))
      
      setOptions(formattedOptions)
      setInstructions(instructionData)
      setIsLoading(false)
    }
    loadData()
  }, [])

  const handleNext = () => {
    updateData({ teachingStyles: selected })
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
        <p className="text-slate-600 mb-6">
          {instructions.subtitle}
        </p>
      )}
      {instructions.helper && (
        <p className="text-sm text-slate-500 mb-6">
          {instructions.helper}
        </p>
      )}

      <MultiSelect
        options={options}
        selected={selected}
        onChange={setSelected}
        maxSelections={3}
        columns={2}
        className="mb-8"
      />

      <NavigationButtons
        onNext={handleNext}
        nextPath="/onboarding/interests"
        backPath="/onboarding/subjects"
        isNextDisabled={selected.length === 0}
      />
    </div>
  )
}