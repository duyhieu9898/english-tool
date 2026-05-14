# Cẩm Nang Phòng Tránh Cạm Bẫy Playwright (Common Pitfalls)

---

# Các Cạm Bẫy Thường Gặp Trong Playwright

**Khi nào dùng:** Khi học Playwright, xem xét lại các test để tìm lỗi phổ biến, hoặc hướng dẫn thành viên mới vào dự án.

 lỗi phổ biến nhất trong Playwright, sắp xếp theo tần suất xuất hiện trong thực tế. Mỗi cạm bẫy bao gồm triệu chứng, nguyên nhân gốc rễ và cách sửa hoàn chỉnh.

## Bảng Tra Cứu Nhanh

| # | Cạm Bẫy | Cách Sửa Một Dòng |
|---|---|---|
| 1 | `waitForTimeout()` | Thay bằng `expect(locator).toBeVisible()` |
| 3 | CSS selector | Dùng `getByRole()`, `getByLabel()`, `getByTestId()` |
| 4 | Kiểm tra `isVisible()` | Dùng `expect(locator).toBeVisible()` |
| 5 | State chung có thể thay đổi | Dùng test-scoped fixture với dữ liệu duy nhất |
| 8 | Không xử lý điều hướng | Thêm `page.waitForURL()` sau khi submit form |
| 10 | `innerHTML` / `textContent` | Dùng `expect(locator).toHaveText()` |
| 11 | Over-mock API của mình | Chỉ mock dịch vụ bên ngoài |
| 12 | Không có `test.describe` | Nhóm test liên quan, giới hạn phạm vi `beforeEach` và `test.use()` |
| 13 | `beforeAll` cho setup từng test | Dùng `beforeEach` hoặc test-scoped fixture |
| 14 | Biến dữ liệu test cấp module | Tạo dữ liệu trong từng test hoặc qua fixture |
| 15 | Lồng `describe` sâu (3+) | Tối đa 2 cấp; tách thành file riêng |

---

# Cạm Bẫy 1: Dùng `page.waitForTimeout()` Thay Vì Assertions

**Triệu chứng:** Test chạy chậm và không ổn định. Pass trên máy nhanh nhưng fail trên CI runner chậm.

**Nguyên nhân:** Lập trình viên mang thói quen từ Selenium hoặc Cypress, nơi việc chờ thủ công là cần thiết. Trong Playwright, các assertion tự động retry đã xử lý timing tự động.

**Cách sửa:** Thay toàn bộ `waitForTimeout` bằng web-first assertion hoặc chờ một điều kiện cụ thể.

**TypeScript**

```typescript
import { test, expect } from '@playwright/test';

// SAI
test('sai: chờ tùy tiện', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Load' }).click();
  await page.waitForTimeout(3000);
  await expect(page.getByTestId('chart')).toBeVisible();
});

// ĐÚNG
test('đúng: assertion tự động retry', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Load' }).click();
  await expect(page.getByTestId('chart')).toBeVisible();
});
```

```typescript
// ĐÚNG - khi cần chờ một sự kiện mạng cụ thể
test('đúng: chờ response', async ({ page }) => {
  await page.goto('/dashboard');
  const responsePromise = page.waitForResponse('**/api/chart-data');
  await page.getByRole('button', { name: 'Load' }).click();
  await responsePromise;
  await expect(page.getByTestId('chart')).toBeVisible();
});
```

**JavaScript**

```javascript
const { test, expect } = require('@playwright/test');

// SAI
test('sai: chờ tùy tiện', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Load' }).click();
  await page.waitForTimeout(3000);
  await expect(page.getByTestId('chart')).toBeVisible();
});

// ĐÚNG
test('đúng: assertion tự động retry', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Load' }).click();
  await expect(page.getByTestId('chart')).toBeVisible();
});
```

**Trường hợp duy nhất được dùng `waitForTimeout`:** Debug khi không dùng được `page.pause()`, hoặc mô phỏng "thời gian suy nghĩ" của người dùng trong performance test. **Tuyệt đối không dùng trong code test thực tế.**

---

# Cạm Bẫy 3: Dùng CSS Selector Thay Vì Locator Dựa Trên Role

**Triệu chứng:** Test bị hỏng mỗi khi tên CSS class, cấu trúc DOM, hoặc thư viện component thay đổi. Test khó đọc vì selector trông như `.btn-primary > span:nth-child(2)`.

**Nguyên nhân:** Lập trình viên dùng những gì quen thuộc từ jQuery hoặc DevTools. CSS selector là chi tiết triển khai, thay đổi thường xuyên.

**Cách sửa:** Dùng các locator có sẵn của Playwright nhắm đến accessible role, label, text và test ID.

**TypeScript**

```typescript
import { test, expect } from '@playwright/test';

// SAI - CSS selector dễ hỏng
test('sai: CSS selector', async ({ page }) => {
  await page.goto('/settings');
  await page.locator('.form-group:nth-child(3) input.form-control').fill('giá trị mới');
  await page.locator('button.btn.btn-primary.submit-btn').click();
  await expect(page.locator('.alert.alert-success')).toBeVisible();
});

// ĐÚNG - locator dựa trên role
test('đúng: locator có thể truy cập', async ({ page }) => {
  await page.goto('/settings');
  await page.getByLabel('Tên hiển thị').fill('giá trị mới');
  await page.getByRole('button', { name: 'Lưu' }).click();
  await expect(page.getByRole('alert')).toHaveText('Đã lưu cài đặt');
});
```

```javascript
const { test, expect } = require('@playwright/test');

// SAI
test('sai: CSS selector', async ({ page }) => {
  await page.locator('.form-group:nth-child(3) input').fill('giá trị mới');
  await page.locator('button.btn-primary').click();
});

// ĐÚNG
test('đúng: locator có thể truy cập', async ({ page }) => {
  await page.getByLabel('Tên hiển thị').fill('giá trị mới');
  await page.getByRole('button', { name: 'Lưu' }).click();
});
```

**Thứ tự ưu tiên locator (bền nhất đến kém bền nhất):**

1.  `getByRole()` — accessible role + name
2.  `getByLabel()` — trường form theo label text
3.  `getByPlaceholder()` — input theo placeholder
4.  `getByText()` — nội dung text hiển thị
5.  `getByTestId()` — thuộc tính `data-testid` ổn định
6.  CSS/XPath selector — chỉ dùng như phương án cuối cùng

---

# Cạm Bẫy 4: Dùng Giá Trị Trả Về Của `isVisible()` Thay Vì `expect().toBeVisible()`

**Triệu chứng:** Test pass khi element chưa hiển thị. Assertion sai lặng lẽ. Không ổn định dưới áp lực timing.

**Nguyên nhân:** `isVisible()` trả về boolean tại một thời điểm duy nhất — không retry. Nếu element chưa xuất hiện, nó trả về `false` và `expect(false).toBe(true)` thất bại ngay lập tức mà không chờ.

**Cách sửa:** Luôn dùng `expect(locator).toBeVisible()`, tự động retry cho đến khi element xuất hiện hoặc hết timeout.

**TypeScript**

```typescript
import { test, expect } from '@playwright/test';
```

```typescript
// SAI - chỉ kiểm tra một lần, không retry
test('sai: kiểm tra isVisible', async ({ page }) => {
  await page.goto('/dashboard');
  const visible = await page.getByTestId('widget').isVisible();
  expect(visible).toBe(true); // Fail ngay nếu widget chưa render xong
});

// ĐÚNG - tự động retry trong tối đa 5 giây
test('đúng: assertion toBeVisible', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByTestId('widget')).toBeVisible();
});
```

**JavaScript**

```javascript
const { test, expect } = require('@playwright/test');

// SAI
test('sai: kiểm tra isVisible', async ({ page }) => {
  const visible = await page.getByTestId('widget').isVisible();
  expect(visible).toBe(true);
});

// ĐÚNG
test('đúng: assertion toBeVisible', async ({ page }) => {
  await expect(page.getByTestId('widget')).toBeVisible();
});
```

**Áp dụng cho tất cả phương thức "chỉ resolve một lần":** `isVisible()`, `isEnabled()`, `isChecked()`, `textContent()`, `getAttribute()`, `inputValue()`. **Luôn dùng web-first assertion `expect(locator)` tương ứng.**

**Lưu ý quan trọng — Không nhầm lẫn với `waitFor` dùng làm technical sync.** `locator.waitFor({ state: 'visible' })` có timeout mặc định 30 giây và được dùng để "chặn" trước các API không tự auto-wait (`count()`, `evaluate()`, `innerText()`). Thay thế nó bằng `toBeVisible()` (timeout mặc định 5 giây) có thể gây timeout sớm trên CI chậm.

| Pattern | Mục đích | Timeout mặc định |
|---|---|---|
| `expect(loc).toBeVisible()` | Assertion — xác minh trạng thái app | 5 giây |
| `loc.waitFor({ state: 'visible' })` | Sync — chặn trước lời gọi không auto-wait | 30 giây |

---

# Cạm Bẫy 5: Chia Sẻ Trạng Thái Có Thể Thay Đổi Giữa Các Test Song Song

**Triệu chứng:** Test pass khi chạy riêng lẻ nhưng fail trong toàn bộ bộ test. Lỗi phụ thuộc thứ tự. Lỗi "Duplicate key".

**Nguyên nhân:** Biến ở cấp module, hàng dữ liệu dùng chung trong database, hoặc state được tạo bởi `beforeAll` bị một test thay đổi và test khác đang chạy song song thấy được.

**Cách sửa:** Dùng fixture có phạm vi test với dữ liệu duy nhất. Không bao giờ lưu trạng thái có thể thay đổi trong biến cấp module.

**TypeScript**

```typescript
import { test as base, expect } from '@playwright/test';

// SAI - trạng thái cấp module được chia sẻ giữa các test song song
let userId: string;

test.beforeAll(async ({ request }) => {
  const res = await request.post('/api/users', {
    data: { email: 'shared@test.com' },
  });
  userId = (await res.json()).id; // Mỗi worker song song đều ghi đè giá trị
});

test('sai: dùng trạng thái chung', async ({ page }) => {
  await page.goto(`/users/${userId}`); // userId có thể đến từ worker khác
});

// ĐÚNG - fixture có phạm vi test với dữ liệu duy nhất cho mỗi test
export const test = base.extend<{ testUser: { id: string; email: string } }>({
  testUser: async ({ request }, use) => {
    const email = `user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const res = await request.post('/api/users', { data: { email } });
    const user = await res.json();

    await use({ id: user.id, email });

    await request.delete(`/api/users/${user.id}`);
  },
});

test('đúng: dữ liệu độc lập cho mỗi test', async ({ page, testUser }) => {
  await page.goto(`/users/${testUser.id}`);
  await expect(page.getByText(testUser.email)).toBeVisible();
});
```

**JavaScript**

```javascript
const { test: base, expect } = require('@playwright/test');
```

```javascript
// ĐÚNG
const test = base.extend({
  testUser: async ({ request }, use) => {
    const email = `user-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const res = await request.post('/api/users', { data: { email } });
    const user = await res.json();

    await use({ id: user.id, email });

    await request.delete(`/api/users/${user.id}`);
  },
});

test('đúng: dữ liệu độc lập cho mỗi test', async ({ page, testUser }) => {
  await page.goto(`/users/${testUser.id}`);
  await expect(page.getByText(testUser.email)).toBeVisible();
});

module.exports = { test };
```

---

# Cạm Bẫy 8: Không Xử Lý Điều Hướng Sau Khi Submit Form

**Triệu chứng:** Test fail với "Target page, context or browser has been closed" hoặc assertion fail vì trang đã điều hướng đi trước khi assertion chạy.

**Nguyên nhân:** Click nút submit kích hoạt điều hướng toàn trang. Assertion chạy trên trang cũ đang được dỡ tải.

**Cách sửa:** Chờ điều hướng hoàn tất trước khi assert trên trang mới.

**TypeScript**

```typescript
import { test, expect } from '@playwright/test';

// SAI - assertion chạy trước khi điều hướng hoàn tất
test('sai: không xử lý điều hướng', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@test.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  // Trang đang điều hướng - có thể fail với "Execution context was destroyed"
  await expect(page.getByRole('heading')).toHaveText('Dashboard');
});

// ĐÚNG - chờ URL thay đổi, rồi mới assert
test('đúng: dùng waitForURL sau khi điều hướng', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@test.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await page.waitForURL('/dashboard');
  await expect(page.getByRole('heading')).toHaveText('Dashboard');
});
```

```typescript
// ĐÚNG - dùng expect().toHaveURL() tự động retry
test('đúng: assertion toHaveURL', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@test.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.getByRole('heading')).toHaveText('Dashboard');
});
```

**JavaScript**

```javascript
const { test, expect } = require('@playwright/test');

// ĐÚNG
test('đúng: dùng waitForURL sau khi điều hướng', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@test.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await page.waitForURL('/dashboard');
  await expect(page.getByRole('heading')).toHaveText('Dashboard');
});
```

---

# Cạm Bẫy 10: Dùng `innerHTML` Để Assert Text Thay Vì `toHaveText()`

**Triệu chứng:** Test bị hỏng khi cấu trúc HTML thay đổi. Assertion dễ vỡ và khó đọc.

**Nguyên nhân:** Lập trình viên dùng `innerHTML()` hoặc `textContent()` để lấy text rồi assert trên chuỗi đã resolve. Cách này chỉ resolve một lần, không retry.

**Cách sửa:** Dùng `expect(locator).toHaveText()` hoặc `expect(locator).toContainText()` để assertion text tự động retry.

**TypeScript**

```typescript
import { test, expect } from '@playwright/test';

// SAI - resolve một lần, bao gồm cả thẻ HTML, không retry
test('sai: assertion innerHTML', async ({ page }) => {
  await page.goto('/product/123');
  const html = await page.getByTestId('price').innerHTML();
  expect(html).toContain('$49.99'); // Dễ vỡ: phụ thuộc cấu trúc HTML
});

// SAI - textContent resolve một lần, không retry
test('sai: assertion textContent', async ({ page }) => {
  await page.goto('/product/123');
  const text = await page.getByTestId('price').textContent();
  expect(text).toBe('$49.99'); // Không retry nếu text chưa tải xong
});

// ĐÚNG - tự động retry, không phụ thuộc HTML
test('đúng: assertion toHaveText', async ({ page }) => {
  await page.goto('/product/123');
  await expect(page.getByTestId('price')).toHaveText('$49.99');
});

// ĐÚNG - khớp một phần để assertion linh hoạt hơn
test('đúng: assertion toContainText', async ({ page }) => {
  await page.goto('/product/123');
  await expect(page.getByTestId('price')).toContainText('$49');
});
```

**JavaScript**

```javascript
const { test, expect } = require('@playwright/test');

// SAI
test('sai: assertion textContent', async ({ page }) => {
  const text = await page.getByTestId('price').textContent();
  expect(text).toBe('$49.99');
});

// ĐÚNG
test('đúng: assertion toHaveText', async ({ page }) => {
  await expect(page.getByTestId('price')).toHaveText('$49.99');
});
```

---

# Cạm Bẫy 11: Over-Mocking (Mock API Của Chính Mình)

**Triệu chứng:** Tất cả test đều pass nhưng ứng dụng bị lỗi trên production. Response mock lệch với API thật. Tạo ra sự tự tin giả.

**Nguyên nhân:** Lập trình viên mock mọi API call để tăng tốc độ và ổn định, kể cả backend của chính mình. Các mock trở nên lỗi thời khi API thật thay đổi.

**Cách sửa:** Chỉ mock các dịch vụ bên thứ ba bên ngoài. Test API của chính mình với dữ liệu thật. Dùng `webServer` để chạy backend trong quá trình test.

**TypeScript**

```typescript
import { test, expect } from '@playwright/test';

// SAI - mock API của chính mình làm giảm độ tin cậy
test('sai: mock API của chính mình', async ({ page }) => {
  await page.route('**/api/users/me', (route) =>
    route.fulfill({
      status: 200,
      body: JSON.stringify({ name: 'Test User', role: 'admin' }),
    })
  );
  await page.goto('/dashboard');
  await expect(page.getByText('Test User')).toBeVisible(); // Pass dù API thực tế có thể đã thay đổi
});
```

```typescript
// ĐÚNG - chỉ mock dịch vụ bên ngoài, test API của mình với dữ liệu thật
test('đúng: API thật, mock dịch vụ ngoài', async ({ page }) => {
  // Chặn analytics và quảng cáo bên thứ ba
  await page.route(/google-analytics|intercom|segment/, (route) => route.abort());

  // Stub nhà cung cấp thanh toán bên ngoài không ổn định
  await page.route('**/api.stripe.com/**', (route) =>
    route.fulfill({
      status: 200,
      body: JSON.stringify({ status: 'succeeded' }),
    })
  );

  // Test với API thật của ứng dụng
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
```

**JavaScript**

```javascript
const { test, expect } = require('@playwright/test');

// ĐÚNG - chỉ mock dịch vụ bên ngoài
test('đúng: API thật, mock dịch vụ ngoài', async ({ page }) => {
  await page.route(/google-analytics|intercom|segment/, (route) => route.abort());

  await page.route('**/api.stripe.com/**', (route) =>
    route.fulfill({
      status: 200,
      body: JSON.stringify({ status: 'succeeded' }),
    })
  );

  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
```

**Khi nào được phép mock API của chính mình:** Test các trạng thái lỗi cụ thể (500, 503, network timeout) hoặc edge case khó tái tạo với backend thật.

# Cạm Bẫy 12: Không Dùng `test.describe` Để Nhóm Test

**Triệu chứng:** File test là danh sách phẳng các test không liên quan. Không thể giới hạn phạm vi cấu hình chung (`test.use()`, `test.beforeEach()`). Báo cáo HTML khó điều hướng.

**Nguyên nhân:** Lập trình viên viết test thành danh sách phẳng, không bao giờ nhóm các test liên quan lại.

**Cách sửa:** Nhóm các test liên quan bằng `test.describe`. Dùng để giới hạn phạm vi setup chung, ghi đè cấu hình và tổ chức theo logic.

**TypeScript**

```typescript
import { test, expect } from '@playwright/test';

// SAI - danh sách phẳng, không nhóm, không ngữ cảnh chung
test('admin có thể xem danh sách user', async ({ page }) => { /* ... */ });
test('admin có thể xóa user', async ({ page }) => { /* ... */ });
test('viewer không thể xóa user', async ({ page }) => { /* ... */ });
test('viewer có thể xem danh sách user', async ({ page }) => { /* ... */ });

// ĐÚNG - nhóm theo role, cấu hình có phạm vi
test.describe('admin users', () => {
  test.use({ storageState: '.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/users');
  });

  test('có thể xem danh sách user', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('có thể xóa user', async ({ page }) => {
    await page.getByRole('row').first().getByRole('button', { name: 'Xóa' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});

test.describe('viewer users', () => {
  test.use({ storageState: '.auth/viewer.json' });
});
```

```javascript
test('có thể xem danh sách user', async ({ page }) => {
  await page.goto('/admin/users');
  await expect(page.getByRole('table')).toBeVisible();
});

test('không thể thấy nút Xóa', async ({ page }) => {
  await page.goto('/admin/users');
  await expect(page.getByRole('button', { name: 'Xóa' })).not.toBeVisible();
});
```

**JavaScript**

```javascript
const { test, expect } = require('@playwright/test');

test.describe('admin users', () => {
  test.use({ storageState: '.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/users');
  });

  test('có thể xem danh sách user', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('có thể xóa user', async ({ page }) => {
    await page.getByRole('row').first().getByRole('button', { name: 'Xóa' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
```

---

# Cạm Bẫy 13: Dùng `beforeAll` Cho Setup Từng Test

**Triệu chứng:** Các test lẽ ra độc lập lại chia sẻ state từ `beforeAll`. Một test thay đổi state và các test sau đó bị fail.

**Nguyên nhân:** Lập trình viên nghĩ `beforeAll` "hiệu quả hơn" vì chỉ chạy một lần. Nhưng `beforeAll` tạo ra state có phạm vi worker được chia sẻ bởi tất cả test trong file.

**Cách sửa:** Dùng `beforeEach` cho setup từng test, hoặc dùng test-scoped fixture cho setup cần teardown.

**TypeScript**

```typescript
import { test, expect } from '@playwright/test';

// SAI - beforeAll tạo một user cho tất cả test; các test thay đổi state
test.beforeAll(async ({ request }) => {
  // User này được chia sẻ cho tất cả test trong file
  await request.post('/api/users', { data: { email: 'shared@test.com', name: 'Nguyên bản' } });
});

test('cập nhật tên user', async ({ page }) => {
  await page.goto('/users/shared@test.com');
  await page.getByLabel('Tên').fill('Đã cập nhật');
  await page.getByRole('button', { name: 'Lưu' }).click();
  // Giờ user chung có tên "Đã cập nhật" - các test khác thấy điều này
});

test('kiểm tra tên user là Nguyên bản', async ({ page }) => {
  await page.goto('/users/shared@test.com');
  // FAIL - test trước đã đổi tên
  await expect(page.getByLabel('Tên')).toHaveValue('Nguyên bản');
});

// ĐÚNG - mỗi test tạo user riêng của mình
test.describe('user profile', () => {
  test('cập nhật tên user', async ({ page, request }) => {
    const email = `user-${Date.now()}@test.com`;
    await request.post('/api/users', { data: { email, name: 'Nguyên bản' } });

    await page.goto(`/users/${email}`);
    await page.getByLabel('Tên').fill('Đã cập nhật');
    await page.getByRole('button', { name: 'Lưu' }).click();
    await expect(page.getByLabel('Tên')).toHaveValue('Đã cập nhật');
  });
});
```

**JavaScript**

```javascript
const { test, expect } = require('@playwright/test');
```

```javascript
// ĐÚNG - tạo dữ liệu cho từng test
test('cập nhật tên user', async ({ page, request }) => {
  const email = `user-${Date.now()}@test.com`;
  await request.post('/api/users', { data: { email, name: 'Nguyên bản' } });

  await page.goto(`/users/${email}`);
  await page.getByLabel('Tên').fill('Đã cập nhật');
  await page.getByRole('button', { name: 'Lưu' }).click();
  await expect(page.getByLabel('Tên')).toHaveValue('Đã cập nhật');
});
```

---

# Cạm Bẫy 14: Lưu Dữ Liệu Test Trong Biến Dùng Chung Giữa Các Test

**Triệu chứng:** Test B phụ thuộc vào dữ liệu được tạo trong Test A. Sắp xếp lại thứ tự hoặc chạy song song sẽ làm hỏng bộ test.

**Nguyên nhân:** Lập trình viên khai báo biến `let` ở cấp module, gán trong một test và mong test khác đọc được.

**Cách sửa:** Mỗi test phải tự tạo dữ liệu của mình. Dùng fixture cho logic setup dùng chung.

**TypeScript**

```typescript
import { test, expect } from '@playwright/test';

// SAI - test B phụ thuộc vào test A để tạo sản phẩm
let productId: string;

test('test A: tạo sản phẩm', async ({ request }) => {
  const res = await request.post('/api/products', { data: { name: 'Widget' } });
  productId = (await res.json()).id;
});

test('test B: sửa sản phẩm', async ({ page }) => {
  await page.goto(`/products/${productId}/edit`); // undefined nếu test A chưa chạy hoặc chạy ở worker khác
});

// ĐÚNG - mỗi test độc lập hoàn toàn
test('tạo và sửa sản phẩm', async ({ page, request }) => {
  const res = await request.post('/api/products', { data: { name: 'Widget' } });
  const id = (await res.json()).id;
```

```typescript
  const { id } = await res.json();

  await page.goto(`/products/${id}/edit`);
  await page.getByLabel('Tên').fill('Widget Đã Cập Nhật');
  await page.getByRole('button', { name: 'Lưu' }).click();
  await expect(page.getByText('Widget Đã Cập Nhật')).toBeVisible();

  // Dọn dẹp
  await request.delete(`/api/products/${id}`);
});
```

**JavaScript**

```javascript
const { test, expect } = require('@playwright/test');

// ĐÚNG - mỗi test độc lập hoàn toàn
test('tạo và sửa sản phẩm', async ({ page, request }) => {
  const res = await request.post('/api/products', { data: { name: 'Widget' } });
  const { id } = await res.json();

  await page.goto(`/products/${id}/edit`);
  await page.getByLabel('Tên').fill('Widget Đã Cập Nhật');
  await page.getByRole('button', { name: 'Lưu' }).click();
  await expect(page.getByText('Widget Đã Cập Nhật')).toBeVisible();

  await request.delete(`/api/products/${id}`);
});
```

---

# Cạm Bẫy 15: Lồng `test.describe` Quá Sâu

**Triệu chứng:** Cấu trúc test sâu 3+ cấp. Khó đọc. Hook `beforeEach` từ block bên ngoài không thấy được ở cấp test. Báo cáo HTML lộn xộn.

**Nguyên nhân:** Lập trình viên tổ chức test như tổ chức code — phân cấp lồng nhau sâu. Nhưng test nên phẳng và dễ quét.

**Cách sửa:** Giới hạn tối đa 2 cấp lồng. Dùng file riêng thay vì lồng sâu.

**TypeScript**

```typescript
import { test, expect } from '@playwright/test';

// SAI - 4 cấp sâu, không thể theo dõi
test.describe('admin', () => {
  test.describe('settings', () => {
    test.describe('security', () => {
      test.describe('two-factor auth', () => {
        test('bật TOTP', async ({ page }) => {
          // Hook beforeEach nào đã chạy trước đây? Khó mà biết được.
        });
      });
    });
  });
});

// ĐÚNG - tối đa 2 cấp, rõ ràng và phẳng
test.describe('cài đặt bảo mật admin', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/settings/security');
  });

  test('bật xác thực hai yếu tố qua TOTP', async ({ page }) => {
    await page.getByRole('button', { name: 'Bật 2FA' }).click();
    await expect(page.getByText('Quét mã QR')).toBeVisible();
  });

  test('tắt xác thực hai yếu tố', async ({ page }) => {
    await page.getByRole('button', { name: 'Tắt 2FA' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
```

**JavaScript**

```javascript
const { test, expect } = require('@playwright/test');

// ĐÚNG - cấu trúc phẳng, tối đa 2 cấp
test.describe('cài đặt bảo mật admin', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/settings/security');
  });

  test('bật xác thực hai yếu tố qua TOTP', async ({ page }) => {
```

```javascript
    await page.getByRole('button', { name: 'Bật 2FA' }).click();
    await expect(page.getByText('Quét mã QR')).toBeVisible();
  });
});
```

Nếu cần tổ chức nhiều test, hãy tách thành các file riêng: `security-2fa.spec.ts`, `security-passwords.spec.ts`, `security-sessions.spec.ts`.
