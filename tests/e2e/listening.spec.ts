import { test, expect } from '@playwright/test';

test.describe('Listening Module', () => {
  test('should navigate to listening level and lesson', async ({ page }) => {
    // 1. Go to Home
    await page.goto('/');

    // 2. Click Listening card
    await page.click('text=Listening');
    await expect(page).toHaveURL(/\/listening$/);

    // 3. Select Level A1
    await page.click('text=A1');
    await expect(page).toHaveURL(/\/listening\/a1$/);

    // 4. Select the first Lesson
    const firstLesson = page.locator('button:has-text("Start Play"), button:has-text("Review"), button:has-text("Replay Stage")').first();
    await expect(firstLesson).toBeVisible({ timeout: 10000 });
    await firstLesson.click();

    // 5. Verify we are in the listening session
    await expect(page).toHaveURL(/\/listening\/a1\/.+$/);
    await expect(page.locator('text=Listen and type')).toBeVisible();
  });

  test('should allow typing and checking an answer', async ({ page }) => {
    // Navigate directly to an A1 session
    await page.goto('/listening/a1');
    const firstLesson = page.locator('button:has-text("Start Play"), button:has-text("Review"), button:has-text("Replay Stage")').first();
    await firstLesson.click();

    // 1. Check if textarea is visible
    const textarea = page.locator('textarea[placeholder="What did you hear?"]');
    await expect(textarea).toBeVisible();

    // 2. Type something (even if wrong)
    await textarea.fill('test answer');

    // 3. Click Check button
    await page.click('button:has-text("Check")');

    // 4. Verify that feedback is shown
    await expect(page.locator('button[disabled]')).toBeHidden();
  });

  test('should show hint when clicking a masked word', async ({ page }) => {
    await page.goto('/listening/a1');
    const firstLesson = page.locator('button:has-text("Start Play"), button:has-text("Review"), button:has-text("Replay Stage")').first();
    await firstLesson.click();

    // 1. Lấy danh sách TẤT CẢ các nút từ (cả ẩn và hiện)
    const allWordButtons = page.locator('div.flex-wrap button');

    // 2. Tìm xem cái nút ĐẦU TIÊN có dấu sao đang nằm ở vị trí thứ mấy (Index)
    const targetIndex = await allWordButtons.evaluateAll((buttons) => {
      return buttons.findIndex((btn) => btn.textContent?.includes('*'));
    });

    if (targetIndex === -1) {
      console.log('Không tìm thấy từ nào bị ẩn!');
      return;
    }

    // 3. Khóa chặt vào cái nút ở Index đó (không dùng filter nữa)
    const targetButton = allWordButtons.nth(targetIndex);

    const htmlBefore = await targetButton.evaluate((el) => el.outerHTML);
    console.log(`--- DEBUG: BEFORE CLICK (Index ${targetIndex}) ---`, htmlBefore);

    await targetButton.click();

    const htmlAfter = await targetButton.evaluate((el) => el.outerHTML);
    console.log(`--- DEBUG: AFTER CLICK (Index ${targetIndex}) ---`, htmlAfter);

    // 4. Kiểm tra đúng cái nút ở Index đó xem đã hiện chữ chưa
    await expect(targetButton).not.toHaveText(/\*/);
  });
});
