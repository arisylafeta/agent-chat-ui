import { test, expect } from '@playwright/test';

// Validate responsive breakpoint behavior for the sidebar (md: 768px)
// We compare screenshots at 767px (md-) and 768px (md+)

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('sidebar at 767px (md-)', async ({ page }) => {
  await page.setViewportSize({ width: 767, height: 800 });
  await page.goto('/?chatHistoryOpen=true');
  await page.getByText('Agent Chat').first().waitFor({ state: 'visible' });
  await page.waitForTimeout(150);
  await expect(page).toHaveScreenshot('sidebar-md-minus.png');
});

test('sidebar at 768px (md+)', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 800 });
  await page.goto('/?chatHistoryOpen=true');
  await page.getByText('Agent Chat').first().waitFor({ state: 'visible' });
  await page.waitForTimeout(150);
  await expect(page).toHaveScreenshot('sidebar-md-plus.png');
});
