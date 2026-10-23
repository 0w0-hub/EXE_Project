// TASK-098: helper dùng chung cho các smoke test — giữ file test chính gọn, tránh lặp code
// đăng ký/đăng xuất giữa các spec.

export function uniqueEmail(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`
}

// Register.jsx/Login.jsx dùng `<label>` đứng cạnh `<input>` trong `.form-group`, KHÔNG có
// `htmlFor`/`id` liên kết — nên `getByLabel` của Playwright không match được (đã xác nhận qua chạy
// test thật, lỗi timeout chờ `getByLabel('Họ và tên')`). Scope theo `.form-group` chứa đúng nhãn rồi
// lấy `input` bên trong, thay vì dựa vào liên kết label/input không tồn tại trong markup hiện tại.
function fieldInput(page, labelText) {
  return page.locator('.form-group', { hasText: labelText }).locator('input')
}

export async function registerNewUser(page, { fullName, email, password }) {
  await page.goto('/register')
  await fieldInput(page, 'Họ và tên').fill(fullName)
  await fieldInput(page, 'Email').fill(email)
  await fieldInput(page, 'Mật khẩu').fill(password)
  await page.getByRole('button', { name: 'Đăng ký' }).click()
}

export async function loginUser(page, { email, password }) {
  await page.goto('/login')
  await fieldInput(page, 'Email').fill(email)
  await fieldInput(page, 'Mật khẩu').fill(password)
  await page.getByRole('button', { name: 'Đăng nhập' }).click()
}

// Dashboard hiện tour onboarding (TASK-080/081) cho lần đầu vào trang (chưa có cờ `homely_onboarding_seen`
// trong localStorage) — overlay che kín màn hình, chặn click các phần tử khác (đã xác nhận qua chạy
// test thật, lỗi "onboarding-tour-overlay ... intercepts pointer events"). Nhấn Esc tương đương bấm
// "Bỏ qua" (xem components/OnboardingTour.jsx, useEscapeKey(true, onClose)).
export async function dismissOnboardingTourIfPresent(page) {
  const overlay = page.locator('.onboarding-tour-overlay')
  if (await overlay.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape')
    await overlay.waitFor({ state: 'hidden' })
  }
}

// Nút "Đăng xuất" nằm trong dropdown "Tài khoản" ở NavBar (xem components/NavBar.jsx, AccountMenu) —
// phải mở dropdown trước khi click được.
export async function logoutUser(page) {
  await page.locator('.account-menu__trigger').click()
  await page.getByRole('button', { name: 'Đăng xuất' }).click()
}
