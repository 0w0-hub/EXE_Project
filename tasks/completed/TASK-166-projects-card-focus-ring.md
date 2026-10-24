# TASK-166

## Title

Viền focus rõ ràng theo theme khi điều hướng card Project bằng bàn phím

## Goal

Ý tưởng từ ChatGPT round 35, đã vét trước qua Explore agent, xác nhận NEW/VALID nhưng CHƯA CẤP THIẾT — hiện KHÔNG có `.card:focus`/`.card:focus-visible` nào trong `styles.css`, cũng KHÔNG có global `outline: none` reset nào xoá mất outline mặc định của trình duyệt — nghĩa là card ĐANG có 1 viền focus mặc định của trình duyệt khi điều hướng bàn phím (TASK-148/154), nhưng chưa được style theo đúng theme của app (không đồng bộ với các viền focus khác đã có, vd `.projects-search-input:focus`).

- **Nâng cấp viền focus**: thêm `.card:focus-visible` (hoặc class tương ứng của card project) dùng ĐÚNG pattern viền focus đã có ở `.projects-search-input:focus` (`outline: none; border-color: var(--color-secondary); box-shadow: 0 0 0 3px var(--color-secondary-tint);`), đồng bộ trực quan.

## Scope

- `frontend/src/styles.css`:
  - Thêm rule `.card:focus-visible` (hoặc selector đúng class card Project đang dùng trong `Projects.jsx`, agent tự xác nhận) — dùng lại ĐÚNG pattern token đã có ở `.projects-search-input:focus` (`--color-secondary`/`--color-secondary-tint`), KHÔNG bịa màu mới.
  - Dùng `:focus-visible` (không phải `:focus` trần) để chỉ hiện viền khi điều hướng bàn phím thật, không hiện khi bấm chuột (đúng chuẩn UX hiện đại, tránh viền xuất hiện không cần thiết lúc click).

## Out of scope

- Không đổi logic điều hướng bàn phím (TASK-148/154) — chỉ thêm CSS.
- Không áp dụng cho card ở trang khác ngoài `Projects.jsx` trong task này (nếu class `.card` dùng chung toàn app, cân nhắc phạm vi ảnh hưởng — agent kiểm tra kỹ trước khi quyết định scope class selector đúng, tránh đổi giao diện ngoài ý muốn ở trang khác).

## Dependencies

`styles.css` (`.projects-search-input:focus` làm pattern mẫu), `Projects.jsx` (card có `tabIndex={0}` từ TASK-148).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Điều hướng tới 1 card Project bằng phím Tab/mũi tên (TASK-148/154) → viền focus MỚI hiện rõ, đúng màu theme (`--color-secondary`), không phải viền mặc định xám của trình duyệt.
- Bấm chuột vào card → KHÔNG hiện viền focus-visible (đúng hành vi `:focus-visible`).
- Không hồi quy: điều hướng bàn phím, các trang khác dùng chung class `.card` (nếu có) không bị đổi giao diện ngoài ý muốn.
- Console sạch lỗi.

## Testing

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`/`RoomNew.jsx`). Coordinator gộp rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome cùng lúc với TASK-167.

## Coordinator verification

Dispatch cho 1 background agent, không đụng `Room3DViewer.jsx`/`RoomNew.jsx`. Agent tự phát hiện + tránh đúng 1 rủi ro không nêu trong spec: class `.card` dùng chung ở 25+ file trong toàn app (Dashboard, DesignResult, Login, admin...), style thẳng `.card:focus-visible` sẽ ảnh hưởng NGOÀI Ý MUỐN tới mọi trang khác — thay vào đó target đúng `.project-preview-trigger` (class đã có sẵn từ TASK-144, CHỈ dùng trong `Projects.jsx`, đã có sẵn cho cả grid card lẫn list row) — không cần đổi JSX, chỉ thêm CSS.

`npm run build` PASS. Docker rebuild + Playwright TASK-098 regression: 3/3 PASS ngay lần đầu.

Verify E2E qua Claude in Chrome: `.focus()` gọi qua JS KHÔNG kích hoạt `:focus-visible` (đúng hành vi trình duyệt, heuristic chỉ nhận diện điều hướng bàn phím thật) — chuyển sang dùng `computer` tool bấm phím Tab THẬT: focus rơi đúng vào card, `card.matches(':focus-visible')` = `true`, đọc `getComputedStyle` xác nhận `box-shadow: rgb(229, 242, 252) 0px 0px 0px 3px` (đúng `--color-secondary-tint`) + `outline: ... none` — viền mới hiện đúng, đồng bộ theme. Console sạch lỗi.

## Status

COMPLETED
