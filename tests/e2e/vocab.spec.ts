import { test, expect } from '@playwright/test';
import { E2E_SELECTORS } from './e2e-constants';

test.describe('Vocabulary Flow (Functional - Mocked)', () => {
  const MOCK_LESSON = {
    id: '1',
    name: 'Unit 1: Greetings',
    level: 'a1',
    words: [
      { term: 'hello', meaning: 'xin chào', full_sentence: 'Hello there!', modifiers: 'Greeting' },
      { term: 'goodbye', meaning: 'tạm biệt', full_sentence: 'Goodbye!', modifiers: 'Farewell' }
    ]
  };

  test('Standard Lifecycle (Finish a lesson)', async ({ page }) => {
    // 1. Mock API calls
    await page.route('**/lessons/1', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify(MOCK_LESSON) });
    });

    await page.route('**/sessionProgress?id=1', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) }); // No existing progress
    });

    await page.route('**/lessonProgress', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    await page.route('**/session/finish', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    // 2. Start Test
    await page.goto('/vocabulary/a1/1');

    const flashcard = page.getByTestId(E2E_SELECTORS.VOCAB.FLASHCARD).first();
    const rememberedBtn = page.getByTestId(E2E_SELECTORS.VOCAB.REMEMBERED_BTN);
    const progressLabel = page.getByTestId(E2E_SELECTORS.PROGRESS_LABEL).first();

    // Word 1: Hello
    await test.step('process first word', async () => {
      await expect(progressLabel).toHaveAttribute('data-current-stage', '1');
      await flashcard.click();
      await rememberedBtn.click();
    });

    // Word 2: Goodbye
    await test.step('process second word', async () => {
      await expect(progressLabel).toHaveAttribute('data-current-stage', '2');
      await flashcard.click();
      await rememberedBtn.click();
    });

    // 3. Verify Completion
    await test.step('verify completion screen', async () => {
      await expect(page.getByTestId(E2E_SELECTORS.COMPLETION_TITLE)).toBeVisible();
      await expect(page.getByTestId(E2E_SELECTORS.RETURN_HOME_BTN)).toBeVisible();
    });
  });

  test('Resume Flow (Start from middle)', async ({ page }) => {
    // Mock API: Session already has 1 word finished
    await page.route('**/lessons/1', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify(MOCK_LESSON) });
    });

    await page.route('**/sessionProgress?id=1', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify([{
          id: '1',
          currentIndex: 1, // Start at index 1 (second word)
          rememberedTerms: ['hello'], // IMPORTANT: Must match currentIndex for consistency check
          continueQueueTerms: [],
          lastUpdated: new Date().toISOString()
        }])
      });
    });

    await page.route('**/lessonProgress', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    await page.goto('/vocabulary/a1/1');

    // Verify we started at Stage 2 immediately
    const progressLabel = page.getByTestId(E2E_SELECTORS.PROGRESS_LABEL).first();
    await expect(progressLabel).toHaveAttribute('data-current-stage', '2');

    // Finish the last word
    await page.getByTestId(E2E_SELECTORS.VOCAB.FLASHCARD).first().click();
    await page.getByTestId(E2E_SELECTORS.VOCAB.REMEMBERED_BTN).click();

    await expect(page.getByTestId(E2E_SELECTORS.COMPLETION_TITLE)).toBeVisible();
  });
});
