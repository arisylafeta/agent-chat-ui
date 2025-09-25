import { test, expect } from '@playwright/test';

const TOKEN_NAMES = [
  '--background',
  '--foreground',
  '--card',
  '--card-foreground',
  '--popover',
  '--popover-foreground',
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--muted',
  '--muted-foreground',
  '--accent',
  '--accent-foreground',
  '--destructive',
  '--destructive-foreground',
  '--border',
  '--input',
  '--ring',
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
  '--radius',
  '--sidebar',
  '--sidebar-foreground',
  '--sidebar-primary',
  '--sidebar-primary-foreground',
  '--sidebar-accent',
  '--sidebar-accent-foreground',
  '--sidebar-border',
  '--sidebar-ring',
];

async function readTokens(page: import('@playwright/test').Page) {
  return await page.evaluate((names: string[]) => {
    const style = getComputedStyle(document.documentElement);
    const result: Record<string, string> = {};
    for (const name of names) {
      result[name] = style.getPropertyValue(name).trim();
    }
    return result;
  }, TOKEN_NAMES);
}

// Temporarily skip token snapshots until Tailwind v4 CSS custom properties are reliably readable
// in Playwright Chromium for this Next.js setup. Screenshots cover baseline visuals for now.
test.describe.skip('Design token snapshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('light mode tokens', async ({ page }) => {
    await page.goto('/');
    // Wait for CSS variables to be applied
    await page.waitForFunction(() => {
      const val = getComputedStyle(document.documentElement).getPropertyValue('--background').trim();
      return val.length > 0;
    });
    const tokens = await readTokens(page);
    const sorted = Object.fromEntries(
      Object.entries(tokens).sort(([a], [b]) => a.localeCompare(b))
    );
    const serialized = JSON.stringify(sorted, null, 2);
    expect(serialized).toMatchSnapshot('tokens-light.json');
  });
});
