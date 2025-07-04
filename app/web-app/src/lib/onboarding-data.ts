import { OnboardingContent, OnboardingGoal } from "@/types/onboarding"

// API-driven functions that fetch data from the database
export async function getOnboardingContent(screenName: string): Promise<OnboardingContent[]> {
  try {
    const response = await fetch(`/api/onboarding/content?screen=${screenName}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.status}`)
    }
    
    const data = await response.json()
    return data.content || []
  } catch (error) {
    console.error(`Error fetching onboarding content for ${screenName}:`, error)
    return []
  }
}

export async function getOnboardingGoals(): Promise<OnboardingGoal[]> {
  try {
    const response = await fetch('/api/onboarding/content?screen=goals')
    
    if (!response.ok) {
      throw new Error(`Failed to fetch goals: ${response.status}`)
    }
    
    const data = await response.json()
    return data.goals || []
  } catch (error) {
    console.error('Error fetching onboarding goals:', error)
    return []
  }
}

export async function getOnboardingInstructions(screenName: string): Promise<{ main: string; subtitle?: string; helper?: string }> {
  try {
    const response = await fetch(`/api/onboarding/content?screen=${screenName}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch instructions: ${response.status}`)
    }
    
    const data = await response.json()
    const content = data.content || []
    
    // Extract instructions from content
    const instructions: { main: string; subtitle?: string; helper?: string } = { main: '' }
    
    content
      .filter(item => item.content_type === 'instruction')
      .forEach(item => {
        if (item.content_key === 'main') {
          instructions.main = item.content_value
        } else if (item.content_key === 'subtitle') {
          instructions.subtitle = item.content_value
        } else if (item.content_key === 'helper') {
          instructions.helper = item.content_value
        }
      })
    
    return instructions
  } catch (error) {
    console.error(`Error fetching onboarding instructions for ${screenName}:`, error)
    return { main: '' }
  }
}