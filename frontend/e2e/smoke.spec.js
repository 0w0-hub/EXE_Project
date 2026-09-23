import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test, expect } from '@playwright/test'
import { uniqueEmail, registerNewUser, loginUser, logoutUser, dismissOnboardingTourIfPresent } from './helpers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOM_PHOTO_FIXTURE = path.join(__dirname, 'fixtures', 'room-photo.png')

// TASK-098: smoke test tự động cho luồng cốt lõi đã verify THỦ CÔNG rất nhiều lần qua Claude in Chrome
// xuyên suốt lịch sử dự án (xem tasks/state/current-state.md mục "Verified", ví dụ TASK-001/008/009) —
// đăng ký → đăng nhập → tạo phòng → generate (AI_PROVIDER=mock, gần tức thì) → poll tới COMPLETED →
// xem đủ 3 tab kết quả (Không gian 3D / Ảnh AI 2D / Sơ đồ mặt bằng) → đăng xuất. Mục tiêu: tự động
// phát hiện hồi quy ở luồng này mà không cần lặp lại thao tác thủ công mỗi lần.
// Cách chạy: xem frontend/e2e/README.md.

test.describe.configure({ mode: 'serial' })

test('luồng cốt lõi: đăng ký → đăng nhập → tạo phòng → generate → xem kết quả → đăng xuất', async ({ page }) => {
  const email = uniqueEmail('smoke')
  const password = 'Test1234'

  await test.step('đăng ký tài khoản mới', async () => {
    await registerNewUser(page, { fullName: 'Smoke Test User', email, password })
    // Đăng ký thành công tự đăng nhập (AuthContext.register) → điều hướng về dashboard "/".
    await expect(page).toHaveURL('/')
    await expect(page.locator('.navbar-user')).toHaveText('Smoke Test User')
    // Tài khoản mới → Dashboard tự hiện tour onboarding (TASK-080/081), phải đóng trước khi thao
    // tác tiếp vì overlay che kín, chặn click NavBar.
    await dismissOnboardingTourIfPresent(page)
  })

  await test.step('đăng xuất rồi đăng nhập lại bằng chính tài khoản vừa tạo', async () => {
    await logoutUser(page)
    await expect(page).toHaveURL('/login')

    await loginUser(page, { email, password })
    await expect(page).toHaveURL('/')
    await expect(page.locator('.navbar-user')).toHaveText('Smoke Test User')
  })

  let jobId

  await test.step('tạo phòng mới với form tối thiểu (+ ảnh phòng) rồi generate', async () => {
    await page.goto('/rooms/new')
    await page.locator('.type-card', { hasText: 'Phòng khách' }).click()
    // Upload ảnh phòng (tuỳ chọn theo form, nhưng có mặt trong luồng đã verify thủ công nhiều lần —
    // xem tasks/state/current-state.md mục "Verified" TASK-001: "...tạo room → upload ảnh →
    // preference → generate..."). MockAiDesignProvider dùng lại đúng ảnh này làm resultAssetId
    // (placeholder ảnh AI 2D) nên upload ảnh cũng giúp tab "Ảnh AI (2D)" có nội dung thật để verify.
    await page.locator('input[type="file"]').setInputFiles(ROOM_PHOTO_FIXTURE)

    await page.getByRole('button', { name: 'Gửi yêu cầu AI thiết kế' }).click()

    // 3 lệnh gọi API tuần tự (tạo room → lưu preference → generate) trước khi điều hướng sang
    // trang kết quả — cho thời gian rộng rãi dù AI_PROVIDER=mock xử lý gần tức thì.
    await page.waitForURL(/\/designs\//, { timeout: 30_000 })
    const match = page.url().match(/\/designs\/([0-9a-fA-F-]+)/)
    jobId = match?.[1]
    expect(jobId).toBeTruthy()
  })

  await test.step('poll tới COMPLETED', async () => {
    await expect(page.locator('.status-badge')).toHaveText('COMPLETED', { timeout: 30_000 })
  })

  await test.step('xem đủ 3 tab kết quả (3D / ảnh AI 2D / sơ đồ mặt bằng)', async () => {
    const tab3d = page.getByRole('button', { name: 'Không gian 3D' })
    const tab2d = page.getByRole('button', { name: 'Ảnh AI (2D)' })
    const tabPlan = page.getByRole('button', { name: 'Sơ đồ mặt bằng' })

    await expect(tab3d).toBeVisible()
    await expect(tab2d).toBeVisible()
    await expect(tabPlan).toBeVisible()

    // Tab 3D là mặc định khi vừa vào trang — canvas Three.js phải render được.
    await expect(page.locator('canvas')).toBeVisible()

    await tab2d.click()
    // `img.room3d-2d-image` chỉ render khi tab === '2d' (xem components/Room3DViewer.jsx).
    await expect(page.locator('img.room3d-2d-image')).toBeVisible()

    await tabPlan.click()
    // Có 2 `svg.room2d-plan` trong DOM khi ở tab này: 1 cái tương tác trong `.no-print` (tab đang mở)
    // + 1 bản luôn render ẩn qua CSS để phục vụ in (`.room3d-print-plan`, xem TASK-036) — scope theo
    // `.no-print` để chỉ khớp đúng 1 phần tử, tránh strict-mode violation của Playwright.
    await expect(page.locator('.no-print svg.room2d-plan')).toBeVisible()

    // Quay lại tab 3D để xác nhận chuyển tab qua lại không hồi quy (không throw, canvas dựng lại được).
    await tab3d.click()
    await expect(page.locator('canvas')).toBeVisible()
  })

  await test.step('đăng xuất', async () => {
    await logoutUser(page)
    await expect(page).toHaveURL('/login')
  })
})
