import { test, expect } from '@playwright/test';

test.describe('Review Modules', () => {
  
  test('Daily Review Flow', async ({ page }) => {
    // 1. Navigate to Daily Review
    await page.goto('/review');
    
    // Check if we are "All Caught Up" or in the Engine
    const caughtUp = page.locator('text=ALL CAUGHT UP!');
    const reviewEngine = page.locator('text=DAILY REVIEW');

    if (await caughtUp.isVisible()) {
      console.log('No words due today, testing "Return Home"');
      await page.click('text=Return Home');
      await expect(page).toHaveURL('/');
    } else {
      await expect(reviewEngine).toBeVisible();
      
      // 2. Test Incorrect Answer Flow
      const input = page.locator('input[aria-label="Enter word translation"]');
      await input.fill('wrong_answer_test');
      await page.keyboard.press('Enter');
      
      // Should show error state
      await expect(page.locator('text=Incorrect!')).toBeVisible();
      
      // Click "Got it" to continue
      await page.click('text=Got it');
      
      // Input should be cleared
      await expect(input).toHaveValue('');
    }
  });


  test('Boss Battle (General Review) Flow', async ({ page }) => {
    // 1. Navigate to General Review (Boss Battle)
    await page.goto('/review/general');
    
    // 2. Wait for the page to finish loading (either NO ENEMIES heading or the Engine Badge)
    const noEnemiesHeading = page.getByRole('heading', { name: 'NO ENEMIES!' });
    const reviewBadge = page.locator('div').filter({ hasText: /^GENERAL REVIEW$/ });
    
    // Wait for either one to become visible
    await expect(noEnemiesHeading.or(reviewBadge)).toBeVisible({ timeout: 20000 });

    if (await noEnemiesHeading.isVisible()) {
      console.log('No Boss Battle available, testing "Learn Vocab" navigation');
      await page.click('text=Learn Vocab');
      await expect(page).toHaveURL(/\/vocabulary$/);
    } else {
      // Review Engine is visible
      await expect(page.locator('text=GENERAL REVIEW')).toBeVisible();
      
      // 3. Test interaction
      const input = page.locator('input[placeholder="Enter word"]');
      await input.fill('boss_test');
      await page.keyboard.press('Enter');
      
      // Should show error state "Defeated!" in Boss Battle
      await expect(page.locator('text=Defeated!')).toBeVisible();
      
      // Click "Continue" to proceed
      await page.click('text=Continue');
      
      await expect(input).toHaveValue('');
    }
  });

});
