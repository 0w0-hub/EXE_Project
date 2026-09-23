# TASK-148

## Title

Điều hướng bàn phím cho danh sách Project

## Goal

Gộp 2 ý tưởng liên quan từ ChatGPT round 28 (hỏi lần 5 trong cùng phiên chat) — cả 2 đều về bàn phím/focus trên `Projects.jsx`:

- "Project Keyboard Navigation" — dùng ↑/↓ chuyển focus giữa các Project, Enter để mở, Esc để bỏ focus.
- "Project Card Quick Open" — khi card đang focus, Enter mở trực tiếp; click ảnh/tên dùng cùng 1 vùng mở. Đã vét trước qua Explore agent: phần "cùng 1 vùng click" ĐÃ CÓ SẴN từ TASK-147 (toàn bộ icon/tên/ngày đã gộp vào 1 `<Link>` duy nhất) — chỉ còn đúng phần "Enter khi đang focus card" là việc mới, GỘP LUÔN vào phạm vi ý #1 vì bản chất là cùng 1 cơ chế điều hướng bàn phím.

Xác nhận `Projects.jsx` (đã đọc toàn bộ 865 dòng qua Explore agent) hiện KHÔNG có `tabIndex`/`onKeyDown` nào ở cấp card/row — chỉ `<Link>` bên trong là phần tử có thể focus tự nhiên, các nút "⋮"/checkbox "Chọn để so sánh" là phần tử focus riêng biệt.

## Scope

- `frontend/src/pages/Projects.jsx`:
  - Container card (grid) và row (list) nhận `tabIndex={0}` + `role="button"` (hoặc tương đương, để trình đọc màn hình hiểu đây là phần tử tương tác) để có thể nhận focus bằng Tab/mũi tên.
  - `onKeyDown` cấp danh sách (hoặc từng card) xử lý: `ArrowDown`/`ArrowRight` → focus card kế tiếp; `ArrowUp`/`ArrowLeft` → focus card trước đó (dùng `document.activeElement`/`ref` mảng, hoặc điều hướng focus qua DOM query trong container list — chọn cách đơn giản nhất khớp cấu trúc grid/list hiện có); `Enter` khi đang focus 1 card → điều hướng tới `href` của card đó (dùng `navigate()` từ `react-router-dom`, đã import sẵn trong file); `Escape` → `blur()` phần tử đang focus (không đóng gì khác, không đụng `useEscapeKey` đã dùng cho popup/menu).
  - KHÔNG đổi hành vi click chuột hiện có (click card vẫn mở như cũ qua `<Link>`, "⋮"/checkbox vẫn tách biệt, Tab tự nhiên vẫn nhảy qua các phần tử focusable khác như trước — chỉ THÊM khả năng dùng mũi tên khi đã ở trong vùng danh sách project).
  - Cân nhắc: chỉ áp dụng ↑/↓ khi KHÔNG đang gõ trong ô tìm kiếm/input khác trên trang (tránh bắt phím mũi tên khi user đang gõ chữ) — kiểm tra `document.activeElement` trước khi xử lý, giống cách `onKeyDown` toàn cục khác trong dự án (`Room3DViewer.jsx`) đã phân biệt ngữ cảnh trước khi bắt phím.

## Out of scope

- "Dashboard Stat Drill-down", "Unsaved Create-Form Guard" — để dành backlog round sau (cần quyết định thiết kế riêng, xem ghi chú ở `current-state.md`).
- Không đổi hành vi Tab tự nhiên của trình duyệt giữa các phần tử KHÔNG phải card (nút "⋮", checkbox, filter...).

## Dependencies

`Projects.jsx` (toàn bộ cấu trúc card/list + `useEscapeKey` đã có từ TASK-147/144), `react-router-dom` `useNavigate` (kiểm tra đã import trong file hay cần thêm).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Tab vào 1 card → mũi tên xuống/phải chuyển focus sang card kế tiếp (grid: theo thứ tự DOM; list: theo hàng).
- Đang focus 1 card → Enter → điều hướng đúng tới project đó (kiểm tra qua URL thật đổi đúng).
- Đang focus 1 card → Esc → mất focus (không lỗi console, không đóng nhầm menu/popup khác).
- Gõ trong ô tìm kiếm "Tìm theo loại phòng" → phím mũi tên KHÔNG nhảy focus card (không bắt nhầm ngữ cảnh).
- Không hồi quy: click chuột mở project, menu "⋮", checkbox so sánh, "Mở nhanh" (TASK-147) đều hoạt động như cũ.
- Console sạch lỗi.

## Testing

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`). Coordinator gộp rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome cùng lúc với TASK-149.

## Coordinator verification

Dispatch cho 1 agent (`Projects.jsx` riêng, song song với TASK-149 trên `RoomNew.jsx`, không đụng chung file). Agent dùng `cardRefs` mảng dùng chung cho cả grid/list (cùng thứ tự `displayItems`), `tabIndex={0}` + `role="button"` cấp card, `onKeyDown` xử lý ↑/↓/←/→/Enter/Esc. Guard `if (e.target !== e.currentTarget) return` thay cho kiểm tra `document.activeElement` — đủ chặt vì handler gắn per-element qua React (không phải global listener), tự nhiên loại trừ ô tìm kiếm/input con mà không cần thêm điều kiện. Enter gọi `recordRecentProject` (dùng đúng bản đã sửa lỗi từ TASK-147) + `navigate()`. `npm run build` PASS.

**Gặp lại + xác nhận thêm 1 biến thể Known Issue công cụ đã biết**: dispatch phím Enter/Return qua `computer` tool's `key` action KHÔNG tới được trang (xác nhận qua listener `keydown` bắt ở `document` capture-phase, `window.__lastKey` vẫn `null` sau khi gọi — không phải do code sai, focus vẫn đúng ở card). Chuyển sang dispatch `KeyboardEvent('keydown', {key:'Enter', bubbles:true})` trực tiếp qua `javascript_tool` trên `document.activeElement` → hoạt động ĐÚNG NGAY, điều hướng chính xác tới project. Escape cũng verify thành công qua cùng cách (dispatch trực tiếp) — `document.activeElement` đổi đúng từ card về `body`.

Docker rebuild frontend + Playwright TASK-098 (3/3 PASS, gộp chung 1 lần với TASK-149). Verify E2E qua Claude in Chrome: card nhận `tabIndex=0`/`role="button"` đúng qua DOM; Enter (dispatch trực tiếp) điều hướng đúng; Escape blur đúng; console sạch lỗi trong suốt quá trình.

## Status

COMPLETED
