import { NextRequest, NextResponse } from "next/server"

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

    // TODO: Fetch from database
    // For now, return the mock data from our onboarding-data.ts file
    // This would be replaced with actual database queries
    
    return NextResponse.json({
      content: [],
      instructions: {}
    })
  } catch (error) {
    console.error("Error fetching onboarding content:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}