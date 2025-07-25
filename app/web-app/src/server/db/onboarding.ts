import { eq, and, sql } from "drizzle-orm"
import { db } from "./index"
import { 
  onboardingContent, 
  onboardingProgress, 
  onboardingGoals, 
  teacherProfiles,
  users 
} from "./schema"

// Onboarding Content Functions
export async function getOnboardingContentByScreen(screenName: string) {
  try {
    const content = await db
      .select()
      .from(onboardingContent)
      .where(
        and(
          eq(onboardingContent.screenName, screenName),
          eq(onboardingContent.isActive, true)
        )
      )
      .orderBy(onboardingContent.displayOrder)

    return content
  } catch (error) {
    console.error(`Error fetching onboarding content for ${screenName}:`, error)
    return []
  }
}

export async function getAllOnboardingGoals() {
  try {
    const goals = await db
      .select()
      .from(onboardingGoals)
      .where(eq(onboardingGoals.isActive, true))
      .orderBy(onboardingGoals.displayOrder)

    return goals
  } catch (error) {
    console.error("Error fetching onboarding goals:", error)
    return []
  }
}

// Onboarding Progress Functions
export async function getOnboardingProgress(userId: string) {
  try {
    const progress = await db
      .select()
      .from(onboardingProgress)
      .where(eq(onboardingProgress.userId, userId))
      .limit(1)

    return progress[0] || null
  } catch (error) {
    console.error(`Error fetching onboarding progress for user ${userId}:`, error)
    return null
  }
}

export async function updateOnboardingProgress(
  userId: string,
  progressData: {
    currentStep?: number
    completedSteps?: number[]
    stepData?: Record<string, unknown>
  }
) {
  try {
    const existingProgress = await getOnboardingProgress(userId)

    if (existingProgress) {
      // Update existing progress
      const updated = await db
        .update(onboardingProgress)
        .set({
          ...progressData,
          updatedAt: new Date(),
        })
        .where(eq(onboardingProgress.userId, userId))
        .returning()

      return updated[0]
    } else {
      // Create new progress record
      const created = await db
        .insert(onboardingProgress)
        .values({
          userId,
          currentStep: progressData.currentStep || 1,
          completedSteps: progressData.completedSteps || [],
          stepData: progressData.stepData || {},
        })
        .returning()

      return created[0]
    }
  } catch (error) {
    console.error(`Error updating onboarding progress for user ${userId}:`, error)
    throw error
  }
}

// Teacher Profile Functions
export async function getTeacherProfile(userId: string) {
  try {
    const profile = await db
      .select()
      .from(teacherProfiles)
      .where(eq(teacherProfiles.userId, userId))
      .limit(1)

    return profile[0] || null
  } catch (error) {
    console.error(`Error fetching teacher profile for user ${userId}:`, error)
    return null
  }
}

export async function createOrUpdateTeacherProfile(
  userId: string,
  profileData: {
    schoolId?: string
    gradesTaught?: string[]
    subjectsTaught?: string[]
    yearsExperience?: number
    teachingStyles?: string[]
    personalInterests?: string[]
    strengths?: string[]
    voiceSampleUrl?: string
    avatarUrl?: string
    onboardingCompleted?: boolean
    preferences?: Record<string, unknown>
  }
) {
  try {
    const existingProfile = await getTeacherProfile(userId)

    if (existingProfile) {
      // Update existing profile
      const updated = await db
        .update(teacherProfiles)
        .set({
          ...profileData,
          updatedAt: new Date(),
        })
        .where(eq(teacherProfiles.userId, userId))
        .returning()

      return updated[0]
    } else {
      // Create new profile
      const created = await db
        .insert(teacherProfiles)
        .values({
          userId,
          ...profileData,
        })
        .returning()

      return created[0]
    }
  } catch (error) {
    console.error(`Error creating/updating teacher profile for user ${userId}:`, error)
    throw error
  }
}

export async function completeOnboarding(
  userId: string,
  onboardingData: {
    gradesTaught: string[]
    subjectsTaught: string[]
    yearsExperience: number
    teachingStyles: string[]
    personalInterests: string[]
    strengths: string[]
    goals: string[]
    voiceSampleUrl?: string
    avatarUrl?: string
  }
) {
  try {
    console.log("🔄 Starting onboarding completion for user:", userId);
    console.log("📊 Onboarding data:", JSON.stringify(onboardingData, null, 2));

    // Ensure user exists in auth.users table (fallback safety check)
    try {
      await db.execute(sql`
        INSERT INTO auth.users (id, email, password_hash, full_name, role, email_verified)
        SELECT id, email, 'oauth_user', name, 'teacher', true
        FROM andi_web_user 
        WHERE id = ${userId}
        ON CONFLICT (id) DO NOTHING
      `);
      console.log("✅ User existence verified in auth.users for:", userId);
    } catch (syncError) {
      console.warn("⚠️ User sync to auth.users failed (may already exist):", syncError);
    }

    // Update teacher profile with all onboarding data
    const profile = await createOrUpdateTeacherProfile(userId, {
      gradesTaught: onboardingData.gradesTaught,
      subjectsTaught: onboardingData.subjectsTaught,
      yearsExperience: onboardingData.yearsExperience,
      teachingStyles: onboardingData.teachingStyles,
      personalInterests: onboardingData.personalInterests,
      strengths: onboardingData.strengths,
      voiceSampleUrl: onboardingData.voiceSampleUrl,
      avatarUrl: onboardingData.avatarUrl,
      onboardingCompleted: true,
      preferences: {
        selectedGoals: onboardingData.goals,
      },
    })
    
    console.log("✅ Teacher profile created/updated:", profile.userId);

    // Mark onboarding progress as completed
    const progressResult = await updateOnboardingProgress(userId, {
      currentStep: 10, // Final step
      completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      stepData: onboardingData,
    })
    console.log("✅ Onboarding progress updated:", progressResult.userId);

    // Update completion timestamp
    await db
      .update(onboardingProgress)
      .set({
        completedAt: new Date(),
      })
      .where(eq(onboardingProgress.userId, userId))
    
    console.log("✅ Onboarding completion timestamp set for:", userId);
    console.log("🎉 Onboarding successfully completed for user:", userId);

    return profile
  } catch (error) {
    console.error(`❌ CRITICAL: Error completing onboarding for user ${userId}:`, error)
    console.error("📊 Failed onboarding data:", JSON.stringify(onboardingData, null, 2))
    throw error
  }
}

export async function checkOnboardingCompletion(userId: string): Promise<boolean> {
  try {
    const profile = await getTeacherProfile(userId)
    return profile?.onboardingCompleted || false
  } catch (error) {
    console.error(`Error checking onboarding completion for user ${userId}:`, error)
    return false
  }
}