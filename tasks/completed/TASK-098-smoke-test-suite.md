# TASK-098

## Title

Bộ smoke test tự động cho luồng quan trọng (Automated Smoke-Test Suite — Playwright)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 7 — ý tưởng "Automated Smoke-Test Suite" ChatGPT đề xuất ở round 5, chưa chọn làm (khác LOẠI công việc so với các round trước — testing infrastructure, không phải 1 tính năng user-facing, nên tách riêng 1 round). Vấn đề thật: sau 97 task liên tiếp sửa/thêm tính năng (đặc biệt `Room3DViewer.jsx`, `DesignResult.jsx`, `App.jsx`, `NavBar.jsx` bị chạm rất nhiều lần qua nhiều round), MỌI verify từ trước tới giờ đều làm THỦ CÔNG qua Claude in Chrome mỗi lần — không có cách nào tự động phát hiện hồi quy ở các luồng đã verify trước đó mà không cần lặp lại thủ công.

**QUAN TRỌNG — khác các round trước**: đây là 1 task DUY NHẤT, không chia nhiều agent song song (bản chất công việc không tách được thành nhiều phần độc lập như các feature trước — 1 bộ test cần nhất quán về cấu trúc/setup).

## Scope

- Đọc `package.json` gốc (thư mục `frontend/`) — xác nhận HIỆN CHƯA có framework test nào (Vitest/Jest/Playwright/Cypress) trước khi thêm.
- Cài `@playwright/test` làm devDependency MỚI trong `frontend/package.json` (npm, không dùng framework khác — Playwright là lựa chọn ChatGPT gợi ý, phù hợp vì app đã chạy thật qua Docker, test có thể nhắm thẳng `http://localhost:8082` đang chạy sẵn, không cần mock).
- Thư mục mới `frontend/e2e/` (hoặc `frontend/tests/smoke/` — tự quyết định, đặt tên rõ ràng), file cấu hình `playwright.config.js` (baseURL trỏ `http://localhost:8082`, KHÔNG tự động khởi động server — giả định Docker đã chạy sẵn, đúng thực tế môi trường dự án).
- Viết smoke test cho ĐÚNG các luồng đã verify thủ công nhiều lần xuyên suốt lịch sử dự án (đọc `tasks/state/current-state.md` mục "Verified" để biết chính xác luồng nào đã test thủ công trước đây, dùng làm cơ sở — KHÔNG bịa luồng mới chưa từng verify):
  1. Đăng ký tài khoản mới → đăng nhập.
  2. Tạo phòng mới (`/rooms/new`) → điền form tối thiểu → generate (dùng `AI_PROVIDER=mock`, xử lý gần như tức thì) → poll tới `COMPLETED`.
  3. Xem trang kết quả (`/designs/:jobId`) → xác nhận đủ 3 tab (Không gian 3D / Ảnh AI 2D / Sơ đồ mặt bằng) chuyển được.
  4. Đăng xuất.
  - Thêm 1-2 test NHỎ độc lập khác nếu thấy hợp lý (ví dụ: trang 404 hiện đúng cho route lạ — TASK-085; đăng nhập sai mật khẩu hiện lỗi đúng) — không bắt buộc, tự quyết định theo thời gian còn lại.
- Thêm script `frontend/package.json`: `"test:e2e": "playwright test"`.
- File `frontend/e2e/README.md` (hoặc comment đầu file test) ngắn gọn: cách chạy (`cd frontend && npx playwright install --with-deps chromium && npm run test:e2e`, yêu cầu Docker Compose đang chạy trước).

## Out of scope

- Không chạy test trong CI/CD (dự án chưa có CI/CD — `rules/devops/ci-cd.md` vẫn ở trạng thái PLANNED, xem `tasks/backlog/README.md` mục 6).
- Không viết test cho MỌI tính năng đã làm qua 97 task (bất khả thi trong 1 task, và không phải mục tiêu — chỉ cần smoke test cho luồng CỐT LÕI nhất).
- Không thêm visual regression/screenshot diffing (ý tưởng gốc ChatGPT có đề xuất nhưng phức tạp hơn — để dành nếu cần round sau, làm smoke test chức năng trước).
- Không sửa bất kỳ file production code nào (`src/`) — chỉ thêm file test + cấu hình, đúng tinh thần "gần như không đụng production code" của ý tưởng gốc.

## Dependencies

Không phụ thuộc task nào khác — đọc `tasks/state/current-state.md` để biết luồng đã verify trước đây làm cơ sở viết test.

## Affected Services

Frontend only (thêm devDependency + file test, không đổi `src/`).

## Acceptance Criteria

- Cài đặt xong, `npx playwright install --with-deps chromium` chạy được (không cần thêm bước thủ công nào khác ngoài README đã ghi).
- Chạy `npm run test:e2e` với Docker Compose đang chạy sẵn (`docker compose up -d`, backend/frontend đã healthy) → PASS toàn bộ (0 fail) cho luồng cốt lõi (đăng ký→đăng nhập→tạo phòng→generate→xem kết quả→đăng xuất).
- Chạy lại 1 test CỐ TÌNH cho sai (ví dụ: đổi 1 selector thành sai) để xác nhận Playwright THẬT SỰ phát hiện lỗi (không phải test giả luôn pass) — SỬA LẠI ĐÚNG trước khi báo cáo xong, chỉ để chứng minh test có tác dụng.
- Không đổi bất kỳ file trong `frontend/src/`.
- `npm run build` vẫn PASS (đảm bảo devDependency mới không phá build production).

## Testing

- Chính task NÀY là viết test — "tự verify" ở đây nghĩa là CHẠY THẬT bộ test vừa viết (không chỉ viết ra rồi suy luận sẽ chạy đúng) — yêu cầu Docker Compose đang chạy sẵn ở `http://localhost:8082`/`:8080` (đã chạy từ round trước, kiểm tra bằng `curl http://localhost:8080/actuator/health` trước khi bắt đầu; nếu không thấy chạy, tự `docker compose up -d` — ĐƯỢC PHÉP làm việc này cho task riêng này, khác quy ước "không tự chạy Docker" của các task feature khác vì đây chính là môi trường test cần thiết).
- Tự tạo tài khoản test riêng qua chính bộ Playwright (không tái dùng tài khoản của round khác, tránh xung đột dữ liệu nếu chạy lại nhiều lần — dùng email ngẫu nhiên/timestamp mỗi lần chạy).
- KHÔNG dùng Claude-in-Chrome (đây là backend/tooling thuần, không cần trình duyệt thủ công của coordinator).
- Báo cáo lại rõ: chạy `npm run test:e2e` thật, dán output đầy đủ (bao nhiêu test, PASS/FAIL, thời gian chạy).

## Status

COMPLETED

## Coordinator verification

Tự chạy lại `npm run test:e2e` (Docker Compose đang chạy sẵn từ round trước, backend healthy) — xác nhận lại đúng 3/3 PASS, đúng như agent đã báo cáo (kết quả tái lập được, không phải may mắn 1 lần): `đăng nhập sai mật khẩu`, `route không tồn tại hiện đúng 404`, `luồng cốt lõi đăng ký→đăng nhập→tạo phòng→generate→xem kết quả→đăng xuất`. Không cần verify qua Claude-in-Chrome (task này tự có browser riêng qua Playwright, không phải tính năng UI mới cho coordinator click qua). Đây là bộ test TỰ ĐỘNG ĐẦU TIÊN của dự án sau 97 task xác minh hoàn toàn thủ công — tài sản có giá trị lâu dài cho các round sau (giảm rủi ro hồi quy khi tiếp tục sửa `Room3DViewer.jsx`/`DesignResult.jsx`/`App.jsx`/`NavBar.jsx`, vốn đã bị chạm rất nhiều lần).
