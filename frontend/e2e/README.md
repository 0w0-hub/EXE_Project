# Smoke Test Suite (TASK-098)

Bộ smoke test Playwright tự động hoá luồng cốt lõi đã được verify thủ công qua Claude in Chrome
rất nhiều lần xuyên suốt lịch sử dự án (xem `tasks/state/current-state.md` mục "Verified"): đăng ký
→ đăng nhập → tạo phòng → generate AI (`AI_PROVIDER=mock`) → poll tới `COMPLETED` → xem đủ 3 tab kết
quả (Không gian 3D / Ảnh AI 2D / Sơ đồ mặt bằng) → đăng xuất. Thêm 2 test nhỏ độc lập: đăng nhập sai
mật khẩu, trang 404 cho route lạ.

## Yêu cầu trước khi chạy

Docker Compose của dự án phải đang chạy sẵn (không tự khởi động server):

```
docker compose up -d
curl http://localhost:8080/actuator/health   # {"status":"UP"}
```

Test nhắm thẳng frontend thật ở `http://localhost:8082` (baseURL trong `playwright.config.js`),
backend thật ở `http://localhost:8080` qua proxy nginx của frontend.

## Cài đặt (chỉ cần 1 lần)

```
cd frontend
npm install
npx playwright install --with-deps chromium
```

## Chạy test

```
cd frontend
npm run test:e2e
```

Mỗi lần chạy tự tạo tài khoản test mới với email ngẫu nhiên/timestamp (xem `e2e/helpers.js`,
`uniqueEmail`) — an toàn để chạy lại nhiều lần, không xung đột dữ liệu với lần chạy trước hay với
tài khoản test của các task khác.

## Phạm vi

- `smoke.spec.js`: luồng cốt lõi đầy đủ (đăng ký → đăng nhập → tạo phòng → generate → xem kết quả →
  đăng xuất).
- `auth-and-404.spec.js`: đăng nhập sai mật khẩu, route lạ → trang 404 (TASK-085).

Không chạy trong CI/CD (dự án chưa có CI/CD, xem `rules/devops/ci-cd.md`). Không có visual
regression/screenshot diffing (để dành cho round sau nếu cần, xem `tasks/active/TASK-098-smoke-test-suite.md`).
