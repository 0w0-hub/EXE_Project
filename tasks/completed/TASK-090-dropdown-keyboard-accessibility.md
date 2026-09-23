# TASK-090

## Title

Đóng dropdown/modal bằng phím Esc + ARIA cơ bản (Keyboard & Accessibility — thu hẹp phạm vi)

## Goal

Tiếp tục vòng lặp "hỏi ChatGPT ý tưởng → nhiều agent tự triển khai" (xem `[[feedback_multiagent_chatgpt_upgrade_loop]]` trong memory, dừng khi user báo dừng). Round 4 — ý tưởng gốc ChatGPT "Keyboard & Accessibility Mode" (round 2) bị hoãn vì làm ARIA cho TOÀN BỘ app là phạm vi quá lớn cho 1 task. Thu hẹp lại đúng 1 phần cụ thể, thật sự thiếu: 2 dropdown mới trong `NavBar.jsx` (chuông thông báo TASK-082, menu tài khoản TASK-083/084/085/087 coordinator vừa thêm) và tour hướng dẫn `OnboardingTour.jsx` (TASK-081) hiện CHỈ đóng được bằng cách bấm ra ngoài/bấm nút — chưa có phím Esc, chưa có `aria-expanded`/`aria-haspopup` trên nút bấm mở.

## Scope

- `frontend/src/components/NavBar.jsx`: đọc kỹ 2 component `NotificationBell` và `AccountMenu` đã có sẵn trong file (state `open`, logic click-outside qua `useEffect`/`wrapRef`).
  - Thêm lắng nghe phím Esc (khi `open === true`) đóng dropdown — dùng `useEffect` riêng hoặc gộp vào effect click-outside hiện có, theo cách nào tự nhiên hơn với code đã có.
  - Thêm `aria-expanded={open}` và `aria-haspopup="true"` vào 2 nút trigger (`.notification-bell__trigger`, `.account-menu__trigger`).
- `frontend/src/components/OnboardingTour.jsx`: thêm lắng nghe phím Esc đóng tour (gọi đúng hàm `onClose` prop đã có sẵn — đọc file trước để dùng đúng tên prop).
- Component mới `frontend/src/hooks/useEscapeKey.js` (tuỳ chọn, KHUYẾN KHÍCH nếu thấy hợp lý) — custom hook dùng chung cho cả 3 nơi trên thay vì lặp lại 3 lần cùng 1 đoạn `useEffect` gần giống nhau. Tự quyết định có đáng làm hay không (nếu code lặp quá ít, giữ nguyên không cần hook riêng cũng được — không ép buộc).

## Out of scope

- Không làm ARIA/focus-trap toàn app (giữ đúng phạm vi hẹp: 3 nơi nêu trên).
- Không thêm phím tắt mới nào khác ngoài Esc cho 3 nơi này (Room3DViewer đã có sẵn bộ phím tắt riêng rất đầy đủ từ TASK-004/034/040/042/052/061/069 — KHÔNG đụng file đó).
- Không đụng `Dashboard.jsx`, `Room3DViewer.jsx`, `Projects.jsx`, `DesignResult.jsx`, các trang `/account/*`.

## Dependencies

`NavBar.jsx` (2 component đã có từ TASK-082 và coordinator round 3), `OnboardingTour.jsx` (TASK-081).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Mở dropdown thông báo (chuông) → nhấn Esc → đóng đúng.
- Mở dropdown "Tài khoản" → nhấn Esc → đóng đúng.
- Mở lại tour hướng dẫn (nút "Xem lại hướng dẫn" ở Dashboard) → nhấn Esc → đóng đúng (không tự động đặt lại flag "đã xem" theo cách khác với nút "Bỏ qua" đã có — tự quyết định hành vi hợp lý, ví dụ Esc coi như tương đương "Bỏ qua").
- Không hồi quy hành vi click-outside/nút bấm đóng đã có của cả 3 nơi.
- Console sạch lỗi.

## Testing

Tự verify bằng `npm run build` PASS trước khi báo cáo xong. KHÔNG tự chạy `docker compose up`/dùng Claude-in-Chrome — coordinator gộp rebuild Docker + verify E2E qua browser thật cho toàn bộ round này sau khi các agent song song hoàn thành (mở từng dropdown/tour, nhấn phím Esc thật qua `computer` tool, xác nhận đóng đúng bằng screenshot).

## Status

COMPLETED

## Coordinator verification

Rebuild Docker đầy đủ + verify E2E qua Docker + browser thật — mở dropdown chuông thông báo → nhấn Esc thật qua `computer` tool → đóng đúng; mở dropdown "Tài khoản" → nhấn Esc → đóng đúng; mở lại tour hướng dẫn qua "Xem lại hướng dẫn" → nhấn Esc → đóng đúng. Không hồi quy click-outside/nút bấm đóng đã có. Console sạch lỗi. Không phát hiện lỗi mới nào.
