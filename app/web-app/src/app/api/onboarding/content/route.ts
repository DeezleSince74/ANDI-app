import { NextRequest, NextResponse } from "next/server"
import { getOnboardingContentByScreen, getAllOnboardingGoals } from "~/server/db/onboarding"

// GET /api/onboarding/content - Get onboarding content by screen name
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const screenName = searchParams.get("screen")

    if (!screenName) {
      return NextResponse.json(
        { error: "Screen name is required" },
        { status: 400 }
      )
    }

    let content = []
    let goals = []

    if (screenName === "goals") {
      // Special handling for goals screen
      goals = await getAllOnboardingGoals()
    } else {
      // Regular content screens
      content = await getOnboardingContentByScreen(screenName)
    }

    return NextResponse.json({
      content: content.map(item => ({
        id: item.id,
        screen_name: item.screenName,
        content_type: item.contentType,
        content_key: item.contentKey,
        content_value: item.contentValue,
        display_order: item.displayOrder,
        is_active: item.isActive,
        metadata: item.metadata
      })),
      goals: goals.map(goal => ({
        id: goal.id,
        category: goal.category,
        title: goal.title,
        description: goal.description,
        display_order: goal.displayOrder,
        is_active: goal.isActive
      }))
    })
  } catch (error) {
    console.error("Error fetching onboarding content:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}