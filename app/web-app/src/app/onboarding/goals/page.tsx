"use client"

import { useState, useEffect } from "react"
import { useOnboarding } from "@/lib/onboarding-context"
import { NavigationButtons } from "@/components/onboarding/navigation-buttons"
import { getOnboardingGoals, getOnboardingInstructions } from "@/lib/onboarding-data"
import { OnboardingGoal } from "@/types/onboarding"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { Card } from "@/components/ui/card"

export default function GoalsPage() {
  const { data, updateData } = useOnboarding()
  const [selected, setSelected] = useState<string[]>(data.goals)
  const [goals, setGoals] = useState<OnboardingGoal[]>([])
  const [instructions, setInstructions] = useState<{ main: string; subtitle?: string; helper?: string }>({ main: '' })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const [goalsData, instructionData] = await Promise.all([
        getOnboardingGoals(),
        getOnboardingInstructions('goal_setting')
      ])
      
      setGoals(goalsData)
      setInstructions(instructionData)
      setIsLoading(false)
    }
    loadData()
  }, [])

  const handleToggle = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return

    const selectedByCategory = {
      equity: selected.filter(id => goals.find(g => g.id === id)?.category === 'equity').length,
      creativity: selected.filter(id => goals.find(g => g.id === id)?.category === 'creativity').length,
      innovation: selected.filter(id => goals.find(g => g.id === id)?.category === 'innovation').length,
    }

    if (selected.includes(goalId)) {
      setSelected(selected.filter(id => id !== goalId))
    } else {
      // Check if we can add this goal
      if (selected.length >= 4) return // Max 4 goals
      
      // Check category limits (max 1 per category for the first 3, then any for the 4th)
      if (selected.length < 3 && selectedByCategory[goal.category] >= 1) return
      
      setSelected([...selected, goalId])
    }
  }

  const handleNext = () => {
    updateData({ goals: selected })
  }

  const isGoalDisabled = (goal: OnboardingGoal) => {
    if (selected.includes(goal.id)) return false
    if (selected.length >= 4) return true
    
    const selectedByCategory = {
      equity: selected.filter(id => goals.find(g => g.id === id)?.category === 'equity').length,
      creativity: selected.filter(id => goals.find(g => g.id === id)?.category === 'creativity').length,
      innovation: selected.filter(id => goals.find(g => g.id === id)?.category === 'innovation').length,
    }
    
    if (selected.length < 3 && selectedByCategory[goal.category] >= 1) return true
    
    return false
  }

  const isValidSelection = () => {
    if (selected.length !== 4) return false
    
    const selectedByCategory = {
      equity: selected.filter(id => goals.find(g => g.id === id)?.category === 'equity').length,
      creativity: selected.filter(id => goals.find(g => g.id === id)?.category === 'creativity').length,
      innovation: selected.filter(id => goals.find(g => g.id === id)?.category === 'innovation').length,
    }
    
    return selectedByCategory.equity >= 1 && 
           selectedByCategory.creativity >= 1 && 
           selectedByCategory.innovation >= 1
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    )
  }

  const goalsByCategory = {
    equity: goals.filter(g => g.category === 'equity'),
    creativity: goals.filter(g => g.category === 'creativity'),
    innovation: goals.filter(g => g.category === 'innovation'),
  }

  const categoryColors = {
    equity: 'border-slate-400 bg-slate-50',
    creativity: 'border-slate-500 bg-slate-100',
    innovation: 'border-slate-600 bg-slate-50',
  }

  const categoryLabels = {
    equity: 'Equity',
    creativity: 'Creativity',
    innovation: 'Innovation',
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        {instructions.main}
      </h1>
      {instructions.subtitle && (
        <p className="text-slate-600 mb-4">
          {instructions.subtitle}
        </p>
      )}
      {instructions.helper && (
        <p className="text-sm text-slate-500 mb-6">
          {instructions.helper}
        </p>
      )}

      <div className="space-y-6">
        {(Object.keys(goalsByCategory) as Array<'equity' | 'creativity' | 'innovation'>).map(category => (
          <div key={category}>
            <h3 className="font-semibold text-lg mb-3 text-slate-900">
              {categoryLabels[category]}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {goalsByCategory[category].map(goal => {
                const isSelected = selected.includes(goal.id)
                const isDisabled = isGoalDisabled(goal)

                return (
                  <Card
                    key={goal.id}
                    className={cn(
                      "relative cursor-pointer transition-all duration-200",
                      "hover:shadow-md",
                      isSelected ? categoryColors[category] : "bg-white",
                      isDisabled && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => !isDisabled && handleToggle(goal.id)}
                  >
                    <div className="p-4">
                      <div className="flex items-start">
                        <div className="flex-1">
                          <p className={cn(
                            "font-medium mb-1",
                            isSelected ? "text-slate-900" : "text-slate-800"
                          )}>
                            {goal.title}
                          </p>
                          <p className={cn(
                            "text-sm",
                            isSelected ? "text-slate-700" : "text-slate-600"
                          )}>
                            {goal.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="ml-3 flex-shrink-0">
                            <div className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center",
                              category === 'equity' && "bg-slate-400",
                              category === 'creativity' && "bg-slate-500",
                              category === 'innovation' && "bg-slate-600"
                            )}>
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-sm text-slate-600">
        Selected: {selected.length} of 4 goals
      </div>

      <NavigationButtons
        onNext={handleNext}
        nextPath="/onboarding/photo-upload"
        backPath="/onboarding/strengths"
        isNextDisabled={!isValidSelection()}
      />
    </div>
  )
}