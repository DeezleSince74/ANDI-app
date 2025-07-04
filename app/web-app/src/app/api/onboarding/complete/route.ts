import { NextRequest, NextResponse } from "next/server"
import { auth } from "~/server/auth"

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

    // TODO: Save to teacher_profiles table
    const teacherProfile = {
      user_id: session.user.id,
      grades_taught: gradeLevels,
      subjects_taught: subjects,
      years_experience: yearsExperience,
      teaching_styles: teachingStyles,
      personal_interests: interests,
      strengths: strengths,
      voice_sample_url: voiceSampleUrl,
      avatar_url: avatarUrl,
      onboarding_completed: true,
      preferences: {
        selected_goals: goals
      }
    }

    console.log("Completing onboarding with profile:", teacherProfile)

    // TODO: Also create teacher goals based on selected goal IDs

    return NextResponse.json({ 
      success: true,
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