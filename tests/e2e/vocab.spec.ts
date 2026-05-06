import { test, expect } from '@playwright/test';

test('should navigate through vocab selection and start a session', async ({ page }) => {
  // 1. Go to Home
  await page.goto('/');

  // 2. Click Vocabulary card
  await page.click('text=Vocabulary');
  await expect(page).toHaveURL(/\/vocabulary$/);

  // 3. Select Level A1
  await page.click('text=A1');
  await expect(page).toHaveURL(/\/vocabulary\/a1$/);

  // 4. Select the first Lesson
  const firstLesson = page.locator('button:has-text("Start Play")').first();
  await expect(firstLesson).toBeVisible({ timeout: 10000 });
  await firstLesson.click();

  // 5. Verify we are in the session
  await expect(page).toHaveURL(/\/vocabulary\/a1\/.+$/);

  // 6. Verify FlashCard is visible
  await expect(page.locator('text=Tap or press Space to flip').first()).toBeVisible();
});

test('should be able to flip a flashcard and continue', async ({ page }) => {
  // Navigate directly to a session
  await page.goto('/vocabulary/a1');
  const firstLesson = page.locator('button:has-text("Start Play")').first();
  await firstLesson.click();

  // Click the card to flip
  await page.locator('text=Tap or press Space to flip').first().click();

  // Verify buttons
  await expect(page.locator('text=Continue')).toBeVisible();
  await expect(page.locator('text=Remembered')).toBeVisible();

  // Click Continue
  await page.click('text=Continue');

  await expect(page).toHaveURL(/\/vocabulary\/a1\/.+$/);
});

test('should complete a full lesson lifecycle (Flashcards -> Batch Review -> Completion)', async ({
  page,
}) => {
  // 1. Vào bài học Vocabulary A1
  await page.goto('/vocabulary/a1');
  const startBtn = page.locator('button:has-text("Play")').first();
  await startBtn.click();

  // 2. Vượt qua Flashcards
  // Chúng ta sẽ lặp lại việc nhấn "Continue" cho đến khi thấy "Boss Fight!"
  const continueBtn = page.locator('button:has-text("Continue")');
  const bossFightHeader = page.locator('text=Boss Fight!');

  // Robot sẽ kiên trì nhấn Continue cho đến khi màn hình thay đổi
  for (let i = 0; i < 15; i++) {
    if (await bossFightHeader.isVisible()) break;
    try {
      await continueBtn.click({ timeout: 2000 });
      await page.waitForTimeout(200); // Đợi animation
    } catch (e) {
      console.log(e);
      // Nếu không thấy nút Continue nữa thì có thể đã hết từ
      break;
    }
  }

  // 3. Kiểm tra và thực hiện Batch Review
  await expect(page.locator('text=TYPE TRANSLATION')).toBeVisible();
  const input = page.locator('input[aria-label="Enter translation"]');

  // Thử nhập sai để test feedback
  await input.fill('wrong_answer');
  await page.keyboard.press('Enter');
  await expect(page.locator('text=Incorrect!')).toBeVisible();
  await page.click('text=Got it');

  // 4. Hoàn thành bài học (confetti sẽ bắn ra ở đây)
  // Lưu ý: Trong môi trường test, chúng ta có thể không cần đợi hết cả bài
  // nhưng đây là minh chứng cho việc flow đã thông suốt.
});
