import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
  });

  test('should display login page with all elements', async ({ page }) => {
    // Check page title and branding
    await expect(page).toHaveTitle(/ANDI Labs/);
    await expect(page.locator('text=ANDI Labs')).toBeVisible();
    
    // Check login form is visible
    const loginCard = page.locator('[class*="card"]').first();
    await expect(loginCard).toBeVisible();
    
    // Check heading
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    await expect(page.getByText('Sign in to your ANDI account')).toBeVisible();
    
    // Check OAuth buttons
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in with Microsoft 365' })).toBeVisible();
    
    // Check email form elements
    await expect(page.getByText('Or continue with email')).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Keep me signed in')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send magic link to email' })).toBeVisible();
    
    // Check legal links
    await expect(page.getByRole('link', { name: 'Read our Terms of Service' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Read our Privacy Policy' })).toBeVisible();
  });

  test('should have proper background image', async ({ page }) => {
    const backgroundElement = page.locator('[style*="background-image"]').first();
    await expect(backgroundElement).toBeVisible();
    
    const backgroundImage = await backgroundElement.evaluate((el) => {
      return window.getComputedStyle(el).backgroundImage;
    });
    
    expect(backgroundImage).toContain('login-background.jpg');
  });

  test('should handle email form submission', async ({ page }) => {
    const emailInput = page.getByLabel('Email address');
    const submitButton = page.getByRole('button', { name: 'Send magic link to email' });
    
    // Button should be disabled when email is empty
    await expect(submitButton).toBeDisabled();
    
    // Enter email
    await emailInput.fill('test@example.com');
    await expect(submitButton).toBeEnabled();
    
    // Submit form
    await submitButton.click();
    
    // Check loading state
    await expect(page.getByText('Sending magic link...')).toBeVisible();
    await expect(submitButton).toBeDisabled();
  });

  test('should validate email format', async ({ page }) => {
    const emailInput = page.getByLabel('Email address');
    const submitButton = page.getByRole('button', { name: 'Send magic link to email' });
    
    // Enter invalid email
    await emailInput.fill('invalid-email');
    await submitButton.click();
    
    // Browser validation should prevent submission
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => 
      el.validationMessage
    );
    expect(validationMessage).toBeTruthy();
  });

  test('should handle OAuth provider clicks', async ({ page }) => {
    // Mock OAuth redirects to prevent actual navigation
    await page.route('**/api/auth/signin/google*', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ url: 'https://accounts.google.com/mock' })
      });
    });
    
    await page.route('**/api/auth/signin/azure-ad*', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ url: 'https://login.microsoftonline.com/mock' })
      });
    });
    
    // Test Google sign in
    const googleButton = page.getByRole('button', { name: 'Sign in with Google' });
    await googleButton.click();
    await expect(page.getByRole('progressbar')).toBeVisible();
    
    // Test Azure AD sign in
    await page.reload();
    const azureButton = page.getByRole('button', { name: 'Sign in with Microsoft 365' });
    await azureButton.click();
    await expect(page.getByRole('progressbar')).toBeVisible();
  });

  test('should navigate to legal pages', async ({ page }) => {
    // Test Terms of Service link
    const termsLink = page.getByRole('link', { name: 'Read our Terms of Service' });
    await termsLink.click();
    await expect(page).toHaveURL('/terms');
    await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible();
    
    // Go back to login
    await page.goBack();
    
    // Test Privacy Policy link
    const privacyLink = page.getByRole('link', { name: 'Read our Privacy Policy' });
    await privacyLink.click();
    await expect(page).toHaveURL('/privacy');
    await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
  });

  test('should handle remember me checkbox', async ({ page }) => {
    const checkbox = page.getByLabel('Keep me signed in');
    
    // Initially unchecked
    await expect(checkbox).not.toBeChecked();
    
    // Check it
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    
    // Uncheck it
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });
});

test.describe('Login Page Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin');
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Start at the top of the page
    await page.keyboard.press('Tab');
    
    // Should focus on Google button first
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeFocused();
    
    // Tab to Microsoft button
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Sign in with Microsoft 365' })).toBeFocused();
    
    // Tab to email input
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Email address')).toBeFocused();
    
    // Tab to checkbox
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Keep me signed in')).toBeFocused();
    
    // Tab to submit button
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Send magic link to email' })).toBeFocused();
    
    // Tab to Terms link
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Read our Terms of Service' })).toBeFocused();
    
    // Tab to Privacy link
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Read our Privacy Policy' })).toBeFocused();
  });

  test('should have proper focus indicators', async ({ page }) => {
    // Check that focused elements have visible focus rings
    const googleButton = page.getByRole('button', { name: 'Sign in with Google' });
    await googleButton.focus();
    
    const focusRing = await googleButton.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return styles.outlineWidth;
    });
    
    expect(parseInt(focusRing)).toBeGreaterThan(0);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    // Check buttons have aria-labels
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toHaveAttribute('aria-label');
    await expect(page.getByRole('button', { name: 'Sign in with Microsoft 365' })).toHaveAttribute('aria-label');
    await expect(page.getByRole('button', { name: 'Send magic link to email' })).toHaveAttribute('aria-label');
    
    // Check form has proper labels
    const emailInput = page.getByLabel('Email address');
    await expect(emailInput).toHaveAttribute('aria-describedby');
    
    // Check checkbox has label
    const checkbox = page.getByLabel('Keep me signed in');
    await expect(checkbox).toHaveAttribute('aria-describedby');
  });

  test('should handle screen reader announcements', async ({ page }) => {
    // Check for screen reader only content
    const srOnlyElements = page.locator('.sr-only');
    const count = await srOnlyElements.count();
    expect(count).toBeGreaterThan(0);
    
    // Check separator has role
    const separator = page.locator('[role="separator"]');
    await expect(separator).toHaveAttribute('aria-label', 'Alternative sign-in methods');
  });

  test('should meet color contrast requirements', async ({ page }) => {
    // This is a simplified check - in production, use axe-core or similar
    const headingColor = await page.getByRole('heading', { name: 'Welcome Back' }).evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    
    // Check that text is not too light
    expect(headingColor).not.toBe('rgb(255, 255, 255)'); // Not white
    expect(headingColor).toMatch(/rgb\(\d+, \d+, \d+\)/); // Valid color format
  });
});

test.describe('Login Page Responsive Design', () => {
  test('should work on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/auth/signin');
    
    // Check that all elements are still visible
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in with Microsoft 365' })).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    
    // Check touch target sizes
    const googleButton = page.getByRole('button', { name: 'Sign in with Google' });
    const box = await googleButton.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44); // Minimum touch target size
  });

  test('should work on tablet devices', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/auth/signin');
    
    // Check layout
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    const loginCard = page.locator('[class*="card"]').first();
    const box = await loginCard.boundingBox();
    
    // Card should not be too wide on tablet
    expect(box?.width).toBeLessThanOrEqual(500);
  });
});

test.describe('Login Page Error Handling', () => {
  test('should show error page when authentication fails', async ({ page }) => {
    // Navigate to error page with error parameter
    await page.goto('/auth/error?error=AccessDenied');
    
    // Check error message is displayed
    await expect(page.getByRole('alert')).toContainText('Authentication Error');
    await expect(page.getByText('You do not have permission to sign in.')).toBeVisible();
    
    // Check back button
    await expect(page.getByRole('link', { name: 'Return to sign in page' })).toBeVisible();
  });

  test('should show verification page after email submission', async ({ page }) => {
    // Navigate to verification page
    await page.goto('/auth/verify-request');
    
    // Check verification message
    await expect(page.getByRole('status')).toContainText('Check your email');
    await expect(page.getByText('magic link to sign in')).toBeVisible();
    
    // Check back link
    await expect(page.getByRole('link', { name: 'Return to sign in page to try again' })).toBeVisible();
  });
});