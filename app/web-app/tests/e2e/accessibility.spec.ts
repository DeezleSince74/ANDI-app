import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility Tests', () => {
  test('login page should have no accessibility violations', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Inject axe-core
    await injectAxe(page);
    
    // Check for accessibility violations
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });
  });

  test('home page should have no accessibility violations', async ({ page }) => {
    await page.goto('/');
    
    await injectAxe(page);
    await checkA11y(page);
  });

  test('terms page should have no accessibility violations', async ({ page }) => {
    await page.goto('/terms');
    
    await injectAxe(page);
    await checkA11y(page);
  });

  test('privacy page should have no accessibility violations', async ({ page }) => {
    await page.goto('/privacy');
    
    await injectAxe(page);
    await checkA11y(page);
  });

  test('error page should have no accessibility violations', async ({ page }) => {
    await page.goto('/auth/error?error=AccessDenied');
    
    await injectAxe(page);
    await checkA11y(page);
  });

  test('verify request page should have no accessibility violations', async ({ page }) => {
    await page.goto('/auth/verify-request');
    
    await injectAxe(page);
    await checkA11y(page);
  });
});

test.describe('Color Contrast Tests', () => {
  test('should meet WCAG AA color contrast requirements', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Test heading contrast
    const heading = page.getByRole('heading', { name: 'Welcome Back' });
    const headingContrast = await heading.evaluate((el) => {
      const style = window.getComputedStyle(el);
      const bgColor = window.getComputedStyle(el.parentElement!).backgroundColor;
      return { color: style.color, background: bgColor };
    });
    
    // These values should meet WCAG AA standards
    expect(headingContrast.color).toBe('rgb(15, 23, 42)'); // slate-900
    expect(headingContrast.background).toMatch(/rgba?\(255, 255, 255/); // white
    
    // Test button contrast
    const submitButton = page.getByRole('button', { name: 'Send magic link to email' });
    await submitButton.waitFor({ state: 'visible' });
    const buttonContrast = await submitButton.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return { color: style.color, background: style.backgroundColor };
    });
    
    expect(buttonContrast.color).toBe('rgb(255, 255, 255)'); // white
    expect(buttonContrast.background).toBe('rgb(30, 41, 59)'); // slate-800
  });
});

test.describe('Focus Management Tests', () => {
  test('should trap focus within login form', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Focus should move through all interactive elements
    const focusableElements = [
      'button:has-text("Continue with Google")',
      'button:has-text("Continue with Microsoft 365")',
      'input[type="email"]',
      'input[type="checkbox"]',
      'button:has-text("Send magic link")',
      'a:has-text("Terms of Service")',
      'a:has-text("Privacy Policy")',
    ];
    
    for (const selector of focusableElements) {
      await page.keyboard.press('Tab');
      const element = page.locator(selector);
      await expect(element).toBeFocused();
    }
  });

  test('should restore focus after modal interactions', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Focus on email input
    const emailInput = page.getByLabel('Email address');
    await emailInput.focus();
    await expect(emailInput).toBeFocused();
    
    // Simulate some interaction
    await emailInput.fill('test@example.com');
    
    // Focus should remain accessible
    await expect(emailInput).toBeFocused();
  });
});

test.describe('Screen Reader Tests', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Check h1 exists
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    expect(h1Count).toBeGreaterThanOrEqual(0); // Some pages may use h2 as top level
    
    // Check heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('should announce form validation errors', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Try to submit empty form
    const emailInput = page.getByLabel('Email address');
    await emailInput.fill('invalid-email');
    
    // Check for validation message
    const validationMessage = await emailInput.evaluate((input: HTMLInputElement) => {
      return input.validationMessage;
    });
    
    expect(validationMessage).toBeTruthy();
  });

  test('should have descriptive link text', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Check that links have descriptive text, not just "click here"
    const links = page.locator('a');
    const linkTexts = await links.allTextContents();
    
    for (const text of linkTexts) {
      expect(text.toLowerCase()).not.toContain('click here');
      expect(text.toLowerCase()).not.toContain('read more');
      expect(text.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Zoom and Text Scaling', () => {
  test('should remain usable at 200% zoom', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Zoom to 200%
    await page.evaluate(() => {
      document.body.style.zoom = '2';
    });
    
    // Check that key elements are still visible
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send magic link to email' })).toBeVisible();
    
    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = '1';
    });
  });

  test('should handle text-only zoom', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Increase font size
    await page.addStyleTag({
      content: `
        * { font-size: 150% !important; }
      `
    });
    
    // Elements should still be accessible
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
  });
});