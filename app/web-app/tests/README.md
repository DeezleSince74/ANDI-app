# ANDI Web App E2E Tests

This directory contains end-to-end tests for the ANDI web application using Playwright.

## Test Structure

- `e2e/` - End-to-end test files
  - `login.spec.ts` - Login page functionality tests
  - `accessibility.spec.ts` - Accessibility compliance tests
  - `dashboard.spec.ts` - Authenticated dashboard tests
  - `helpers/` - Test utility functions

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

### Running Tests

```bash
# Run all tests
npm run test:e2e

# Run tests in UI mode (recommended for development)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test tests/e2e/login.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run tests in headed mode (see browser)
npx playwright test --headed

# Generate and view test report
npm run test:e2e:report
```

## Test Coverage

### Login Page Tests
- ✅ Display all login elements
- ✅ Background image loading
- ✅ Email form validation
- ✅ OAuth provider interactions
- ✅ Navigation to legal pages
- ✅ Remember me checkbox
- ✅ Keyboard navigation
- ✅ Focus management
- ✅ ARIA labels and descriptions
- ✅ Color contrast compliance
- ✅ Responsive design (mobile/tablet)
- ✅ Error handling

### Accessibility Tests
- ✅ WCAG AA compliance (using axe-core)
- ✅ Color contrast verification
- ✅ Focus management
- ✅ Screen reader compatibility
- ✅ Heading hierarchy
- ✅ Form validation announcements
- ✅ Zoom functionality (200%)
- ✅ Text scaling

### Dashboard Tests
- ✅ Authentication requirements
- ✅ Dashboard content display
- ✅ Session information
- ✅ Sign out functionality
- ✅ Mobile responsiveness

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/your-page');
  });

  test('should do something', async ({ page }) => {
    // Your test code
    await expect(page.getByRole('button')).toBeVisible();
  });
});
```

### Using Test Utilities

```typescript
import { mockAuth, waitForPageReady } from './helpers/test-utils';

test('authenticated page test', async ({ page }) => {
  await mockAuth(page);
  await page.goto('/protected-page');
  await waitForPageReady(page);
  // Test authenticated state
});
```

### Accessibility Testing

```typescript
import { injectAxe, checkA11y } from 'axe-playwright';

test('accessibility test', async ({ page }) => {
  await page.goto('/page');
  await injectAxe(page);
  await checkA11y(page);
});
```

## Best Practices

1. **Use semantic selectors**: Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
2. **Wait for elements**: Use `waitFor` methods instead of arbitrary timeouts
3. **Test user interactions**: Focus on how users interact with the page
4. **Mock external services**: Use `page.route()` to mock API calls
5. **Test accessibility**: Include accessibility checks in your tests
6. **Test responsive design**: Check different viewport sizes
7. **Keep tests independent**: Each test should be able to run in isolation

## Debugging Failed Tests

1. **Run in UI mode**: `npm run test:e2e:ui` to see tests run interactively
2. **Use debug mode**: `npm run test:e2e:debug` to step through tests
3. **Check screenshots**: Failed tests save screenshots in `test-results/`
4. **View traces**: Playwright records traces for failed tests
5. **Console logs**: Add `console.log` in page context:
   ```typescript
   await page.evaluate(() => console.log('Debug info'));
   ```

## CI/CD Integration

Tests run automatically on GitHub Actions for:
- Push to main/develop branches
- Pull requests

View test results in:
- GitHub Actions tab
- Artifacts (test reports and screenshots)

## Troubleshooting

### Common Issues

1. **Tests timeout**: Increase timeout in `playwright.config.ts`
2. **Port conflicts**: Ensure port 3000 is free or change in config
3. **Browser not installed**: Run `npx playwright install`
4. **Authentication issues**: Check mock auth setup in test utils

### Environment Variables

Tests require these environment variables (set in CI):
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- OAuth provider credentials

For local testing, create a `.env.test` file with test values.

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)