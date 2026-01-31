import { test } from '@playwright/test';

test('capture auth pages', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/jules/verification/login.png', fullPage: true });

  await page.goto('http://localhost:3000/register');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/jules/verification/register.png', fullPage: true });
});
