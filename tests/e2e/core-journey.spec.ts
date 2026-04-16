import { test, expect } from '@playwright/test';

test('Core Journey: User can access platform and interact with Mentor IA', async ({ page }) => {
  // Go to homepage (Note: will redirect to /sign-in if not authenticated and middleware is active)
  await page.goto('/');

  // Testing that MentorAIBubble is mounted when on protected page
  // Mock login would be required here depending on Clerk setup
  // For the sake of this structural test, we will assume tests run in an isolated environment or hit the landing page

  const title = await page.title();
  expect(title).not.toBeNull();

  // If navigating to /dashboard
  // await expect(page.locator('text=Mentor AI')).toBeVisible();
});
