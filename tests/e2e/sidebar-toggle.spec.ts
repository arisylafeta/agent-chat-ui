import { test, expect } from '@playwright/test';

// Verify the sidebar toggle button updates query state and layout
// Falls back to screenshots to ensure visual change

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('sidebar toggle button updates URL and layout', async ({ page }) => {
  await page.goto('/?chatHistoryOpen=false');
  await page.getByText('Agent Chat').first().waitFor({ state: 'visible' });

  // Click the sidebar toggle button by accessible name
  const btn = page.getByRole('button', { name: 'Toggle sidebar' }).first();
  await btn.waitFor({ state: 'visible' });
  await btn.click();

  await page.waitForFunction(() => new URL(window.location.href).searchParams.get('chatHistoryOpen') === 'true');
  await expect(page).toHaveScreenshot('sidebar-toggled.png');
});
