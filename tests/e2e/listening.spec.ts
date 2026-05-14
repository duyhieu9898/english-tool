import { test, expect } from '@playwright/test';
import { E2E_SELECTORS } from './e2e-constants';

test.describe('Listening Module (Smoke - Real Data)', () => {
  test('should navigate to listening level and lesson', async ({ page }) => {
    await test.step('navigate to level A1', async () => {
      await page.goto('/listening');
      await page.getByTestId(E2E_SELECTORS.LEVEL_A1).click();
      await expect(page).toHaveURL(/\/listening\/a1$/);
    });

    await test.step('select first lesson and verify session starts', async () => {
      await page.getByTestId(E2E_SELECTORS.START_PLAY_BTN).first().click();
      await expect(page).toHaveURL(/\/listening\/a1\/.+$/);
      await expect(page.getByTestId(E2E_SELECTORS.LISTENING.INPUT)).toBeVisible();
    });
  });

  test('should show error feedback when typing wrong answer', async ({ page }) => {
    await page.goto('/listening/a1');
    await page.getByTestId(E2E_SELECTORS.START_PLAY_BTN).first().click();

    await page.getByTestId(E2E_SELECTORS.LISTENING.INPUT).fill('completely wrong answer');
    await page.getByTestId(E2E_SELECTORS.LISTENING.CHECK_BTN).click();

    const wrongWordBadge = page
      .getByTestId(E2E_SELECTORS.LISTENING.WORD_BADGE)
      .and(page.locator('[data-status="error"]'))
      .first();
    await expect(wrongWordBadge).toBeVisible();
  });

  test('should reveal hint when clicking a masked word', async ({ page }) => {
    await page.goto('/listening/a1');
    await page.getByTestId(E2E_SELECTORS.START_PLAY_BTN).first().click();

    const allWordButtons = page.getByTestId(E2E_SELECTORS.LISTENING.WORD_BADGE);
    // waitFor as technical sync (30s default) — not an assertion
    await allWordButtons.first().waitFor({ state: 'visible' });

    // evaluateAll for data extraction (find index by content) — legitimate use
    const targetIndex = await allWordButtons.evaluateAll((buttons) =>
      buttons.findIndex((btn) => btn.textContent?.includes('*'))
    );

    // Fail the test if no masked word is found, rather than passing silently
    expect(targetIndex, 'Should find at least one masked word to test hint').not.toBe(-1);
    const targetButton = allWordButtons.nth(targetIndex);

    await targetButton.click();
    await expect(targetButton).not.toHaveText(/\*/);
  });

  test('should allow progressing when correct answer is submitted via hints', async ({ page }) => {
    await page.goto('/listening/a1');
    await page.getByTestId(E2E_SELECTORS.START_PLAY_BTN).first().click();

    const allWordButtons = page.getByTestId(E2E_SELECTORS.LISTENING.WORD_BADGE);

    await test.step('reveal full sentence via hints', async () => {
      await allWordButtons.first().waitFor({ state: 'visible' });
      const count = await allWordButtons.count();
      for (let i = 0; i < count; i++) {
        await allWordButtons.nth(i).click();
      }
    });

    await test.step('build sentence from revealed words', async () => {
      const count = await allWordButtons.count();
      const words: string[] = [];
      for (let i = 0; i < count; i++) {
        words.push(await allWordButtons.nth(i).innerText());
      }
      const fullSentence = words.join(' ').trim();
      await page.getByTestId(E2E_SELECTORS.LISTENING.INPUT).fill(fullSentence);
      await page.getByTestId(E2E_SELECTORS.LISTENING.CHECK_BTN).click();
    });

    await test.step('verify success state and continue', async () => {
      const continueBtn = page.getByTestId(E2E_SELECTORS.LISTENING.CONTINUE_BTN);
      await expect(continueBtn).toBeVisible();

      const successBadge = page
        .getByTestId(E2E_SELECTORS.LISTENING.WORD_BADGE)
        .and(page.locator('[data-status="success"]'))
        .first();
      await expect(successBadge).toBeVisible();

      await continueBtn.click();
      await expect(page.getByTestId(E2E_SELECTORS.PROGRESS_LABEL)).toHaveAttribute(
        'data-current-stage',
        '2',
        { timeout: 10000 },
      );
    });
  });
});
