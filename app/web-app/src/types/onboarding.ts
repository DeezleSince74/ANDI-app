export interface OnboardingContent {
  id: string
  screen_name: string
  content_type: 'option' | 'instruction' | 'label' | 'placeholder'
  content_key: string
  content_value: string
  display_order: number
  is_active: boolean
  metadata?: Record<string, any>
}

export interface OnboardingGoal {
  id: string
  category: 'equity' | 'creativity' | 'innovation'
  title: string
  description: string
  display_order: number
  is_active: boolean
}

export interface OnboardingProgress {
  user_id: string
  current_step: number
  completed_steps: number[]
  step_data: Record<string, any>
  started_at: Date
  completed_at?: Date
  updated_at: Date
}