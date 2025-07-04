import { NextRequest, NextResponse } from "next/server"
import { auth } from "~/server/auth"

// GET /api/onboarding/progress - Get current onboarding progress
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // TODO: Fetch from database
    // For now, return mock data
    const progress = {
      user_id: session.user.id,
      current_step: 1,
      completed_steps: [],
      step_data: {},
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(progress)
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

    // TODO: Save to database
    console.log("Saving onboarding progress:", {
      user_id: session.user.id,
      current_step,
      completed_steps,
      step_data
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving onboarding progress:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}