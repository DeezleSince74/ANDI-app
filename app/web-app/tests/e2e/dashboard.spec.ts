import { test, expect } from '@playwright/test';
import { mockAuth, waitForPageReady } from './helpers/test-utils';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await mockAuth(page);
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    // Clear auth mock
    await page.context().clearCookies();
    
    // Try to access dashboard
    await page.goto('/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL('/auth/signin');
  });

  test('should display dashboard when authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    // Check dashboard elements
    await expect(page.getByRole('heading', { name: 'ANDI Dashboard' })).toBeVisible();
    await expect(page.getByText('test@example.com')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign out/i })).toBeVisible();
    
    // Check dashboard cards
    await expect(page.getByText('Welcome back!')).toBeVisible();
    await expect(page.getByText('AI Workflows')).toBeVisible();
    await expect(page.getByText('User Profile')).toBeVisible();
  });

  test('should display session information', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    // Check session info card
    await expect(page.getByText('Session Information')).toBeVisible();
    
    // Should show mocked user data
    const sessionContent = page.getByText(/"email": "test@example.com"/);
    await expect(sessionContent).toBeVisible();
  });

  test('should handle sign out', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    // Mock sign out API
    await page.route('**/api/auth/signout', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ url: '/' }),
      });
    });
    
    // Click sign out
    const signOutButton = page.getByRole('button', { name: /Sign out/i });
    await signOutButton.click();
    
    // Should redirect to home page
    await expect(page).toHaveURL('/');
  });

  test('should be accessible', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    // Check heading hierarchy
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    
    // Check that all cards have proper headings
    const cards = page.locator('[class*="card"]');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
    
    // Each card should have a title
    for (let i = 0; i < cardCount; i++) {
      const card = cards.nth(i);
      const title = card.locator('[class*="card-title"], h2, h3');
      await expect(title).toBeVisible();
    }
  });

  test('should work on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    // Check responsive layout
    await expect(page.getByRole('heading', { name: 'ANDI Dashboard' })).toBeVisible();
    
    // Cards should stack vertically on mobile
    const cards = page.locator('[class*="card"]');
    const firstCard = cards.first();
    const secondCard = cards.nth(1);
    
    const firstBox = await firstCard.boundingBox();
    const secondBox = await secondCard.boundingBox();
    
    // Second card should be below first card (Y position greater)
    if (firstBox && secondBox) {
      expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height);
    }
  });
});