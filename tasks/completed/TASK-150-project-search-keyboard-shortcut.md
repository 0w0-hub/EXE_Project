# TASK-150

## Title

Phím tắt focus nhanh ô tìm kiếm trên trang Projects

## Goal

Ý tưởng từ ChatGPT round 29 (hỏi lần 6 trong cùng phiên chat), đã vét trước qua Explore agent, xác nhận CHƯA CÓ: `Projects.jsx` chưa có phím tắt nào focus ô "🔍 Tìm theo loại phòng" — khác hẳn phím "/" đã có ở `Room3DViewer.jsx` (TASK-069, focus ô tìm loại đồ nội thất, trang/tính năng khác hoàn toàn).

- **Phím tắt tìm kiếm**: nhấn "/" (khi KHÔNG đang gõ trong input/textarea khác) → focus ngay ô tìm kiếm trên trang Projects. Esc (khi ô tìm kiếm đang focus) → bỏ focus.

## Scope

- `frontend/src/pages/Projects.jsx`:
  - Thêm `ref` cho input tìm kiếm (`search`) hiện có.
  - `useEffect` gắn `document.addEventListener('keydown', ...)` — khi phím `/` được nhấn VÀ `document.activeElement` KHÔNG phải input/textarea/select nào khác (tránh bắt nhầm khi đang gõ nội dung khác, đúng pattern `preventDefault()` + `focus()` đã dùng ở `Room3DViewer.jsx` TASK-069, điều chỉnh cho ngữ cảnh trang này).
  - Ô tìm kiếm đang focus + nhấn Esc → `blur()` (tương tự cách card xử lý Esc ở TASK-148, KHÔNG đụng `useEscapeKey` đang dùng cho popup/menu khác).
  - Dọn dẹp `removeEventListener` đúng khi unmount.

## Out of scope

- KHÔNG persist trạng thái tìm kiếm qua `localStorage` (không nằm trong phạm vi ý tưởng này).
- KHÔNG đổi hành vi lọc/tìm kiếm hiện có — thuần thêm phím tắt focus.

## Dependencies

`Projects.jsx` (ô tìm kiếm hiện có), pattern phím tắt `/` đã có ở `Room3DViewer.jsx` (TASK-069) làm tham khảo.

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Đang KHÔNG focus input nào → nhấn "/" → ô tìm kiếm Projects nhận focus ngay (kiểm tra `document.activeElement`).
- Đang gõ trong ô tìm kiếm (hoặc input khác) → gõ ký tự "/" bình thường KHÔNG bị chặn/focus nhầm chỗ khác.
- Ô tìm kiếm đang focus → Esc → mất focus.
- Không hồi quy: lọc/tìm kiếm/sort/view mode hiện có.
- Console sạch lỗi.

## Testing

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`). Coordinator gộp rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome cùng lúc với TASK-151.

## Coordinator verification

Dispatch cho 1 agent (`Projects.jsx` riêng, song song TASK-151 trên `NavBar.jsx`/`styles.css`). Agent tái dùng đúng pattern phím "/" từ `Room3DViewer.jsx` (TASK-069) nhưng MỞ RỘNG guard thêm `SELECT` (trang này có dropdown sort, trang 3D không có) — quyết định đúng, khớp yêu cầu "input/textarea/select" trong Scope. Esc tách biệt hoàn toàn 3 cơ chế Esc khác đã có (popup preview TASK-144, menu "⋮" TASK-147, card TASK-148) — chỉ blur khi CHÍNH ô tìm kiếm đang focus. `npm run build` PASS.

Coordinator verify: build tổng hợp 2 task PASS. Docker rebuild frontend + Playwright TASK-098 (3/3 PASS). Verify E2E qua Claude in Chrome: dispatch `KeyboardEvent('/')` trực tiếp qua JS (đúng bài học Known Issue mới từ TASK-148 — không dùng `computer` tool's key action cho phím này) → `document.activeElement` đổi đúng sang ô tìm kiếm; dispatch Escape → blur đúng; focus vào `<select>` sắp xếp rồi dispatch "/" → GIỮ NGUYÊN focus ở `<select>` (guard hoạt động đúng, không cướp focus khi đang ở phần tử nhập liệu khác). Console sạch lỗi.

## Status

COMPLETED
