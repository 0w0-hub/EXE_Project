import { defineConfig, devices } from '@playwright/test'

// TASK-098: baseURL trỏ thẳng frontend đang chạy qua Docker Compose (cổng 8082, xem docker-compose.yml
// service "frontend"). KHÔNG dùng `webServer` để tự khởi động — môi trường dự án luôn giả định
// Docker Compose đã `up -d` sẵn trước khi chạy smoke test (xem frontend/e2e/README.md).
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:8082',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
