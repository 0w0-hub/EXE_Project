import { test, expect } from '@playwright/test'
import { uniqueEmail, registerNewUser, loginUser } from './helpers.js'

// TASK-098: 2 smoke test nhỏ, độc lập với luồng cốt lõi ở smoke.spec.js — theo gợi ý trong scope
// task (đăng nhập sai mật khẩu hiện lỗi đúng; trang 404 cho route lạ, xem TASK-085).

test('đăng nhập sai mật khẩu hiện đúng thông báo lỗi', async ({ page }) => {
  const email = uniqueEmail('badpass')
  const password = 'Test1234'

  await registerNewUser(page, { fullName: 'Bad Pass User', email, password })
  await expect(page).toHaveURL('/')

  // Xoá token để chắc chắn form đăng nhập test đúng luồng gọi API thật, không "đăng nhập nhầm" do
  // token cũ vẫn còn hợp lệ trong localStorage.
  await page.evaluate(() => localStorage.removeItem('homely_access_token'))
  await page.goto('/login')

  await loginUser(page, { email, password: 'wrong-password-123' })

  // Thông báo lỗi thật từ backend (GlobalExceptionHandler.handleBadCredentials) — xem
  // backend/src/main/java/com/homely/api/common/GlobalExceptionHandler.java.
  await expect(page.locator('.error-text')).toHaveText('Email hoặc mật khẩu không đúng')
  await expect(page).toHaveURL('/login')
})

test('route không tồn tại hiện đúng trang 404 (TASK-085)', async ({ page }) => {
  await page.goto('/route-khong-ton-tai-xyz')
  await expect(page.getByText('404', { exact: true })).toBeVisible()
  await expect(page.getByText('Không tìm thấy trang')).toBeVisible()
})
