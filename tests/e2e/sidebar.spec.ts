import { test, expect } from '@playwright/test';

test.describe('Sidebar baseline screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Reduce motion to stabilize screenshots
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('sidebar closed (chatHistoryOpen=false)', async ({ page }) => {
    await page.goto('/?chatHistoryOpen=false');
    // Wait for key UI to render
    await page.getByText('Agent Chat').first().waitFor({ state: 'visible' });
    // Allow any initial layout transition to settle
    await page.waitForTimeout(250);
    await expect(page).toHaveScreenshot('sidebar-closed.png');
  });

  test('sidebar open (chatHistoryOpen=true)', async ({ page }) => {
    await page.goto('/?chatHistoryOpen=true');
    await page.getByText('Agent Chat').first().waitFor({ state: 'visible' });
    await page.waitForTimeout(250);
    await expect(page).toHaveScreenshot('sidebar-open.png');
  });
});
