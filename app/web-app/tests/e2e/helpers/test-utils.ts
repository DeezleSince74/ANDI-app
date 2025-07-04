import { Page } from '@playwright/test';

/**
 * Mock authentication for testing protected pages
 */
export async function mockAuth(page: Page) {
  // Set a mock session cookie
  await page.context().addCookies([
    {
      name: 'authjs.session-token',
      value: 'mock-session-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  // Mock the session API response
  await page.route('**/api/auth/session', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'teacher',
          schoolId: 'test-school',
          districtId: 'test-district',
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
  });
}

/**
 * Wait for page to be fully loaded and interactive
 */
export async function waitForPageReady(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
  
  // Wait for any hydration to complete
  await page.waitForTimeout(500);
}

/**
 * Check if element meets minimum touch target size (44x44px)
 */
export async function checkTouchTargetSize(page: Page, selector: string) {
  const element = page.locator(selector);
  const box = await element.boundingBox();
  
  return {
    width: box?.width || 0,
    height: box?.height || 0,
    meetsStandard: (box?.width || 0) >= 44 && (box?.height || 0) >= 44,
  };
}

/**
 * Get computed color contrast ratio between two elements
 */
export async function getColorContrast(
  page: Page,
  textSelector: string,
  backgroundSelector?: string
) {
  return await page.evaluate(
    ({ textSel, bgSel }) => {
      const textElement = document.querySelector(textSel);
      const bgElement = bgSel ? document.querySelector(bgSel) : textElement?.parentElement;
      
      if (!textElement || !bgElement) return null;
      
      const textStyle = window.getComputedStyle(textElement);
      const bgStyle = window.getComputedStyle(bgElement);
      
      return {
        textColor: textStyle.color,
        backgroundColor: bgStyle.backgroundColor,
        fontSize: textStyle.fontSize,
        fontWeight: textStyle.fontWeight,
      };
    },
    { textSel: textSelector, bgSel: backgroundSelector }
  );
}

/**
 * Test keyboard navigation through focusable elements
 */
export async function testKeyboardNavigation(
  page: Page,
  expectedFocusOrder: string[]
) {
  const results: { selector: string; focused: boolean }[] = [];
  
  for (const selector of expectedFocusOrder) {
    await page.keyboard.press('Tab');
    const element = page.locator(selector);
    const isFocused = await element.evaluate((el) => el === document.activeElement);
    results.push({ selector, focused: isFocused });
  }
  
  return results;
}

/**
 * Check for common accessibility issues
 */
export async function quickAccessibilityCheck(page: Page) {
  return await page.evaluate(() => {
    const issues: string[] = [];
    
    // Check for images without alt text
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    if (imagesWithoutAlt.length > 0) {
      issues.push(`${imagesWithoutAlt.length} images without alt text`);
    }
    
    // Check for form inputs without labels
    const inputsWithoutLabels = document.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([aria-label]):not([aria-labelledby])'
    );
    const orphanInputs = Array.from(inputsWithoutLabels).filter((input) => {
      const id = input.getAttribute('id');
      return !id || !document.querySelector(`label[for="${id}"]`);
    });
    if (orphanInputs.length > 0) {
      issues.push(`${orphanInputs.length} form inputs without labels`);
    }
    
    // Check for empty buttons
    const emptyButtons = document.querySelectorAll('button:empty');
    const buttonsWithoutText = Array.from(emptyButtons).filter(
      (btn) => !btn.getAttribute('aria-label')
    );
    if (buttonsWithoutText.length > 0) {
      issues.push(`${buttonsWithoutText.length} buttons without text or aria-label`);
    }
    
    // Check for missing language attribute
    if (!document.documentElement.getAttribute('lang')) {
      issues.push('Missing language attribute on html element');
    }
    
    return issues;
  });
}