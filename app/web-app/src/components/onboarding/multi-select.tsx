"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface MultiSelectOption {
  id: string
  label: string
  description?: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  maxSelections?: number
  columns?: 1 | 2 | 3
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  maxSelections,
  columns = 2,
  className,
}: MultiSelectProps) {
  const handleToggle = (optionId: string) => {
    if (selected.includes(optionId)) {
      onChange(selected.filter(id => id !== optionId))
    } else {
      if (!maxSelections || selected.length < maxSelections) {
        onChange([...selected, optionId])
      }
    }
  }

  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  }

  return (
    <div className={cn(`grid ${gridCols[columns]} gap-3`, className)}>
      {options.map((option) => {
        const isSelected = selected.includes(option.id)
        const isDisabled = !isSelected && maxSelections && selected.length >= maxSelections

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => handleToggle(option.id)}
            disabled={isDisabled}
            className={cn(
              "relative flex items-start p-4 rounded-lg border-2 transition-all duration-200",
              "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2",
              isSelected
                ? "border-slate-500 bg-slate-50"
                : "border-slate-200 bg-white hover:border-slate-300",
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="flex-1 text-left">
              <p className={cn(
                "font-medium",
                isSelected ? "text-slate-900" : "text-slate-900"
              )}>
                {option.label}
              </p>
              {option.description && (
                <p className={cn(
                  "text-sm mt-1",
                  isSelected ? "text-slate-700" : "text-slate-600"
                )}>
                  {option.description}
                </p>
              )}
            </div>
            {isSelected && (
              <div className="ml-3 flex-shrink-0">
                <div className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}