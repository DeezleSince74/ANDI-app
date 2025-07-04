import { test, expect } from '@playwright/test'

test.describe('Teacher Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Set up authenticated user session for testing
    // For now, navigate directly to onboarding
    await page.goto('/onboarding/grade-levels')
  })

  test('should complete full onboarding flow', async ({ page }) => {
    // Step 1: Grade Levels
    await expect(page.locator('h1')).toContainText('Which grade levels do you teach?')
    await expect(page.locator('[data-testid="progress-indicator"]')).toBeVisible()
    
    // Select a few grade levels
    await page.click('text=3rd Grade')
    await page.click('text=4th Grade')
    await page.click('text=5th Grade')
    
    // Take screenshot for visual regression
    await expect(page).toHaveScreenshot('grade-levels-selected.png')
    
    await page.click('text=Next')

    // Step 2: Teaching Experience
    await expect(page.locator('h1')).toContainText('How many years have you been teaching?')
    
    // Increment years to 5
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="increment-button"]')
    }
    
    await expect(page.locator('[data-testid="years-display"]')).toContainText('5')
    await expect(page).toHaveScreenshot('experience-selected.png')
    
    await page.click('text=Next')

    // Step 3: Subjects Taught
    await expect(page.locator('h1')).toContainText('What subjects do you teach?')
    
    await page.click('text=Mathematics')
    await page.click('text=Science')
    
    await expect(page).toHaveScreenshot('subjects-selected.png')
    
    await page.click('text=Next')

    // Step 4: Teaching Styles
    await expect(page.locator('h1')).toContainText('How would you describe your teaching style?')
    
    await page.click('text=Life Coach')
    await page.click('text=High-Energy Entertainer')
    
    await expect(page).toHaveScreenshot('teaching-styles-selected.png')
    
    await page.click('text=Next')

    // Step 5: Personal Interests
    await expect(page.locator('h1')).toContainText('What are your personal interests?')
    
    await page.click('text=Reading')
    await page.click('text=Technology')
    await page.click('text=Gardening')
    
    await expect(page).toHaveScreenshot('interests-selected.png')
    
    await page.click('text=Next')

    // Step 6: Teaching Strengths
    await expect(page.locator('h1')).toContainText('What are your greatest strengths as a teacher?')
    
    await page.click('text=Communication Skills')
    await page.click('text=Classroom Management')
    await page.click('text=Empathy and Emotional Intelligence')
    
    await expect(page).toHaveScreenshot('strengths-selected.png')
    
    await page.click('text=Next')

    // Step 7: Goal Setting
    await expect(page.locator('h1')).toContainText("Let's set your goals")
    
    // Select one from each category
    await page.click('text=Increase Student Voice') // Equity
    await page.click('text=Encourage Creative Expression') // Creativity
    await page.click('text=Connect to Real World') // Innovation
    await page.click('text=Address Learning Gaps') // Additional goal
    
    await expect(page.locator('text=Selected: 4 of 4 goals')).toBeVisible()
    await expect(page).toHaveScreenshot('goals-selected.png')
    
    await page.click('text=Next')

    // Step 8: Voice Sample Intro
    await expect(page.locator('h1')).toContainText('Voice Sample Recording')
    await expect(page.locator('text=This takes less than 2 minutes')).toBeVisible()
    
    await expect(page).toHaveScreenshot('voice-intro.png')
    
    await page.click('text=Start Recording')

    // Step 9: Voice Recording (mock the recording process)
    await expect(page.locator('h1')).toContainText('Voice Sample Recording')
    await expect(page.locator('text=Good morning, class')).toBeVisible()
    
    // TODO: Mock microphone permissions and recording
    // For now, skip the actual recording functionality in tests
    await page.click('text=Set up later') // Use back button to go to previous screen
    await page.click('text=Complete Onboarding') // Skip recording for test
  })

  test('should validate required selections', async ({ page }) => {
    // Test that Next button is disabled when no selections are made
    await page.goto('/onboarding/grade-levels')
    
    const nextButton = page.locator('text=Next')
    await expect(nextButton).toBeDisabled()
    
    // Select one grade level to enable Next
    await page.click('text=1st Grade')
    await expect(nextButton).toBeEnabled()
  })

  test('should respect selection limits', async ({ page }) => {
    // Test teaching styles selection limit (max 3)
    await page.goto('/onboarding/teaching-styles')
    
    // Select 3 styles
    await page.click('text=Life Coach')
    await page.click('text=High-Energy Entertainer')
    await page.click('text=Chill Teacher')
    
    // Try to select a 4th - it should be disabled
    const fourthOption = page.locator('text=Lunchtime Mentor')
    await expect(fourthOption).toHaveClass(/opacity-50/)
  })

  test('should enforce goal selection rules', async ({ page }) => {
    await page.goto('/onboarding/goals')
    
    // Select one equity goal
    await page.click('text=Increase Student Voice')
    
    // Try to select another equity goal - should be disabled
    const secondEquityGoal = page.locator('text=Create Inclusive Environment')
    await expect(secondEquityGoal).toHaveClass(/opacity-50/)
    
    // Select from other categories
    await page.click('text=Encourage Creative Expression') // Creativity
    await page.click('text=Connect to Real World') // Innovation
    
    // Now should be able to select any goal for the 4th slot
    await page.click('text=Address Learning Gaps')
    
    const nextButton = page.locator('text=Next')
    await expect(nextButton).toBeEnabled()
  })

  test('should maintain progress indicator state', async ({ page }) => {
    await page.goto('/onboarding/grade-levels')
    
    // Check initial progress (step 1 of 9)
    await expect(page.locator('text=Step 1 of 9')).toBeVisible()
    
    // Navigate to step 3
    await page.click('text=3rd Grade')
    await page.click('text=Next')
    await page.click('text=Next')
    
    // Check progress updated (step 3 of 9)
    await expect(page.locator('text=Step 3 of 9')).toBeVisible()
    
    // Check visual progress dots
    const progressDots = page.locator('[data-testid="progress-dot"]')
    await expect(progressDots.nth(0)).toHaveClass(/bg-orange-500/)
    await expect(progressDots.nth(1)).toHaveClass(/bg-orange-500/)
    await expect(progressDots.nth(2)).toHaveClass(/bg-orange-500/)
    await expect(progressDots.nth(3)).toHaveClass(/bg-slate-300/)
  })

  test('should allow navigation back and preserve data', async ({ page }) => {
    await page.goto('/onboarding/grade-levels')
    
    // Select grade levels
    await page.click('text=3rd Grade')
    await page.click('text=4th Grade')
    await page.click('text=Next')
    
    // Go to experience page and set years
    await page.click('[data-testid="increment-button"]')
    await page.click('[data-testid="increment-button"]')
    await page.click('text=Next')
    
    // Go back to check data is preserved
    await page.click('text=Back')
    await expect(page.locator('text=2')).toBeVisible() // Years should be preserved
    
    await page.click('text=Back')
    await expect(page.locator('text=3rd Grade')).toHaveClass(/border-orange-500/) // Selection preserved
  })

  test('should be accessible', async ({ page }) => {
    await page.goto('/onboarding/grade-levels')
    
    // Check for proper heading structure
    await expect(page.locator('h1')).toBeVisible()
    
    // Check for proper button labeling
    const nextButton = page.locator('text=Next')
    await expect(nextButton).toHaveAttribute('type', 'button')
    
    // Check for keyboard navigation
    await page.press('Tab', { delay: 100 })
    await expect(page.locator(':focus')).toBeVisible()
    
    // Test with axe-playwright for accessibility
    // TODO: Add axe-playwright import and accessibility tests
    // await expect(page).toPassAxeTests()
  })
})