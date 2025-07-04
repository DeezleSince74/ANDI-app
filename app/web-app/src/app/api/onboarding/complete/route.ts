import { NextRequest, NextResponse } from "next/server"
import { auth } from "~/server/auth"
import { completeOnboarding } from "~/server/db/onboarding"

// POST /api/onboarding/complete - Complete onboarding and save all data
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      gradeLevels,
      yearsExperience,
      subjects,
      teachingStyles,
      interests,
      strengths,
      goals,
      voiceSampleUrl,
      avatarUrl
    } = body

    const teacherProfile = await completeOnboarding(session.user.id, {
      gradesTaught: gradeLevels,
      subjectsTaught: subjects,
      yearsExperience: yearsExperience,
      teachingStyles: teachingStyles,
      personalInterests: interests,
      strengths: strengths,
      goals: goals,
      voiceSampleUrl: voiceSampleUrl,
      avatarUrl: avatarUrl
    })

    return NextResponse.json({ 
      success: true,
      profile: {
        userId: teacherProfile.userId,
        onboardingCompleted: teacherProfile.onboardingCompleted,
        createdAt: teacherProfile.createdAt?.toISOString(),
        updatedAt: teacherProfile.updatedAt?.toISOString()
      },
      redirectUrl: "/dashboard"
    })
  } catch (error) {
    console.error("Error completing onboarding:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}