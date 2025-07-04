"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"

interface NavigationButtonsProps {
  onNext?: () => void | Promise<void>
  onBack?: () => void
  nextPath?: string
  backPath?: string
  nextLabel?: string
  backLabel?: string
  isNextDisabled?: boolean
  isLoading?: boolean
}

export function NavigationButtons({
  onNext,
  onBack,
  nextPath,
  backPath,
  nextLabel = "Next",
  backLabel = "Back",
  isNextDisabled = false,
  isLoading = false,
}: NavigationButtonsProps) {
  const router = useRouter()

  const handleNext = async () => {
    if (onNext) {
      await onNext()
    }
    if (nextPath && !isNextDisabled) {
      router.push(nextPath)
    }
  }

  const handleBack = () => {
    if (onBack) {
      onBack()
    }
    if (backPath) {
      router.push(backPath)
    }
  }

  return (
    <div className="flex justify-between mt-8">
      <Button
        type="button"
        variant="outline"
        onClick={handleBack}
        disabled={isLoading}
        className="flex items-center space-x-2"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{backLabel}</span>
      </Button>

      <Button
        type="button"
        onClick={handleNext}
        disabled={isNextDisabled || isLoading}
        className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white"
      >
        <span>{nextLabel}</span>
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  )
}