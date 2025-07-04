import { NextRequest, NextResponse } from "next/server"
import { auth } from "~/server/auth"
import { getOnboardingProgress, updateOnboardingProgress } from "~/server/db/onboarding"

// GET /api/onboarding/progress - Get current onboarding progress
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const progress = await getOnboardingProgress(session.user.id)

    if (!progress) {
      // Return default progress if none exists
      return NextResponse.json({
        user_id: session.user.id,
        current_step: 1,
        completed_steps: [],
        step_data: {},
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }

    return NextResponse.json({
      user_id: progress.userId,
      current_step: progress.currentStep,
      completed_steps: progress.completedSteps,
      step_data: progress.stepData,
      started_at: progress.startedAt?.toISOString(),
      completed_at: progress.completedAt?.toISOString(),
      updated_at: progress.updatedAt?.toISOString()
    })
  } catch (error) {
    console.error("Error fetching onboarding progress:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/onboarding/progress - Update onboarding progress
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { current_step, completed_steps, step_data } = body

    const updatedProgress = await updateOnboardingProgress(session.user.id, {
      currentStep: current_step,
      completedSteps: completed_steps,
      stepData: step_data
    })

    return NextResponse.json({ 
      success: true,
      progress: {
        user_id: updatedProgress.userId,
        current_step: updatedProgress.currentStep,
        completed_steps: updatedProgress.completedSteps,
        step_data: updatedProgress.stepData,
        updated_at: updatedProgress.updatedAt?.toISOString()
      }
    })
  } catch (error) {
    console.error("Error saving onboarding progress:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}