import { test, expect } from '@playwright/test';
import { E2E_SELECTORS } from './e2e-constants';

test.describe('Review Modules (Functional - Mocked)', () => {
  test.describe('Daily Review', () => {
    test('should show completion screen when all caught up', async ({ page }) => {
      // Mock: No words due today
      await page.route('**/wordProgress', async (route) => {
        await route.fulfill({ status: 200, body: JSON.stringify([]) });
      });

      await page.goto('/review');

      await expect(page.getByTestId(E2E_SELECTORS.COMPLETION_TITLE)).toBeVisible();
      await page.getByTestId(E2E_SELECTORS.RETURN_HOME_BTN).click();
      await expect(page).toHaveURL('/');
    });

    test('should run review engine when words are pending', async ({ page }) => {
      const today = new Date().toISOString().split('T')[0];

      // Mock: 1 word due today
      await page.route('**/wordProgress', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify([
            {
              id: 'test-word-1',
              term: 'apple',
              definition: 'quả táo',
              lessonId: '1',
              nextReview: today,
              level: 1,
            },
          ]),
        });
      });

      // Mock: Submit session
      await page.route('**/session/finish', async (route) => {
        await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
      });

      await page.goto('/review');

      await expect(page.getByTestId(E2E_SELECTORS.REVIEW.BADGE)).toBeVisible();
      await expect(page.getByTestId(E2E_SELECTORS.PROGRESS_LABEL)).toBeVisible();

      // Submit incorrect answer
      const input = page.getByTestId(E2E_SELECTORS.REVIEW.INPUT);
      await input.fill('wrong_answer');
      await page.keyboard.press('Enter');

      await expect(page.getByTestId(E2E_SELECTORS.ERROR_CONTAINER)).toBeVisible();
      await expect(page.getByTestId(E2E_SELECTORS.FEEDBACK_STATUS)).toBeVisible();

      // Continue
      await page.keyboard.press('Enter');
      await expect(input).toHaveValue('');
    });
  });

  test.describe('Boss Battle (General Review)', () => {
    test('should show no enemies screen when empty', async ({ page }) => {
      // Mock all required APIs for General Review logic
      await page.route('**/lessonProgress', async (route) => {
        await route.fulfill({ status: 200, body: JSON.stringify([]) });
      });
      await page.route('**/lessons', async (route) => {
        await route.fulfill({ status: 200, body: JSON.stringify([]) });
      });
      await page.route('**/wordProgress', async (route) => {
        await route.fulfill({ status: 200, body: JSON.stringify([]) });
      });

      await page.goto('/review/general');

      await expect(page.getByTestId(E2E_SELECTORS.COMPLETION_TITLE)).toBeVisible();
      await page.getByTestId(E2E_SELECTORS.RETURN_HOME_BTN).click();
      await expect(page).toHaveURL(/\/vocabulary$/, { timeout: 10000 });
    });

    test('should run boss battle engine when enemies exist', async ({ page }) => {
      const mockLesson = {
        id: '1',
        name: 'Test Lesson',
        words: [{ term: 'sword', meaning: 'thanh kiếm' }],
      };

      // Mock to satisfy the "Boss Battle" condition:
      // 1. Must have a completed vocabulary lesson
      // 2. The word must NOT be in active wordProgress (meaning it's ready for general review)
      await page.route('**/lessonProgress', async (route) => {
        await route.fulfill({
          status: 200,
          body: JSON.stringify([{ id: '1', type: 'vocabulary', completed: true }]),
        });
      });
      await page.route('**/lessons', async (route) => {
        await route.fulfill({ status: 200, body: JSON.stringify([mockLesson]) });
      });
      await page.route('**/wordProgress', async (route) => {
        await route.fulfill({ status: 200, body: JSON.stringify([]) });
      });

      await page.route('**/session/finish', async (route) => {
        await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
      });

      await page.goto('/review/general');

      await expect(page.getByTestId(E2E_SELECTORS.REVIEW.BADGE)).toBeVisible();

      const input = page.getByTestId(E2E_SELECTORS.REVIEW.INPUT);
      await input.fill('wrong_boss_answer');
      await page.keyboard.press('Enter');

      await expect(page.getByTestId(E2E_SELECTORS.ERROR_CONTAINER)).toBeVisible();
      await expect(page.getByTestId(E2E_SELECTORS.FEEDBACK_STATUS)).toBeVisible();
    });
  });
});
