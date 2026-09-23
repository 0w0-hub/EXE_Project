# TASK-154

## Title

Phím Home/End trong danh sách Project + Giữ từ khoá tìm kiếm khi quay lại trong cùng phiên

## Goal

Gộp 2 ý tưởng từ ChatGPT round 31 (hỏi lần 8 trong cùng phiên chat), đã vét trước qua Explore agent — cả 2 đều CHƯA CÓ, cùng đụng `Projects.jsx`:

- "Projects Keyboard Home/End" — mở rộng `handleCardKeyDown` (TASK-148) thêm `Home` → focus card ĐẦU TIÊN, `End` → focus card CUỐI CÙNG (dùng đúng mảng `cardRefs` đã có).
- "Projects Search Query Restore" — mở 1 project rồi quay lại `Projects` TRONG CÙNG PHIÊN (không phải reload trang) → từ khoá tìm kiếm vẫn còn (hiện tại `search` là `useState('')` thuần, reset mỗi khi component unmount/remount). CHỈ giữ trong CÙNG PHIÊN (không ghi `localStorage`) — đúng tinh thần `sort`/`search` vốn được coi là session-transient theo comment sẵn có ở TASK-106/150, KHÔNG đổi quyết định đó thành persist qua reload.

## Scope

- `frontend/src/pages/Projects.jsx`:
  - **Home/End**: thêm `case 'Home'`/`case 'End'` vào `switch (e.key)` trong `handleCardKeyDown` — `Home` → `cardRefs.current[0]?.focus()`, `End` → `cardRefs.current[cardRefs.current.length - 1]?.focus()`. `e.preventDefault()` như các case khác (tránh cuộn trang mặc định của phím Home/End).
  - **Search Query Restore**: dùng 1 biến MODULE-LEVEL (khai báo NGOÀI component, KHÔNG phải React state/localStorage/sessionStorage) lưu giá trị `search` gần nhất — đọc làm giá trị khởi tạo `useState` (lazy initializer) khi component mount, ghi lại mỗi khi `search` đổi (qua `useEffect` hoặc ngay trong `onChange`). Biến module-level tự nhiên sống sót qua unmount/remount trong CÙNG lần tải trang (SPA, module chỉ load 1 lần), nhưng mất khi F5/đóng tab — đúng "cùng phiên" theo yêu cầu, không cần thêm cơ chế lưu trữ trình duyệt nào.

## Out of scope

- KHÔNG đổi quyết định kiến trúc `sort` là session-only (TASK-106) — không persist `sort`.
- KHÔNG ghi `search` vào `localStorage` (khác hẳn `viewMode`/`pinnedIds`/`recentProjectIds` đã persist qua `localStorage` — `search` CHỦ Ý chỉ sống trong phiên).
- "Mobile Modal Bottom Sheet" — để dành backlog (xem `current-state.md`, xác nhận quy mô lớn hơn 1 round — 3 modal độc lập ở 2 file khác nhau, không có component Modal dùng chung).

## Dependencies

`Projects.jsx` (`handleCardKeyDown`/`cardRefs` từ TASK-148, `search` state hiện có).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Focus vào 1 card bất kỳ → Home → focus chuyển đúng sang card ĐẦU TIÊN trong danh sách.
- Focus vào 1 card bất kỳ → End → focus chuyển đúng sang card CUỐI CÙNG.
- Gõ từ khoá tìm kiếm → mở 1 project (điều hướng đi) → quay lại `/projects` (Back hoặc menu) → từ khoá tìm kiếm VẪN CÒN, danh sách vẫn lọc đúng.
- Reload toàn bộ trang (F5) tại `/projects` → từ khoá tìm kiếm VỀ RỖNG (không persist qua reload — đúng scope).
- Không hồi quy: ↑/↓/←/→/Enter/Esc (TASK-148), "Tìm thấy X project"/Esc xoá chữ (TASK-152), "/" focus (TASK-150).
- Console sạch lỗi.

## Testing

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`). Coordinator gộp rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome cùng lúc với TASK-155/156.

## Coordinator verification

Dispatch cho 1 agent (`Projects.jsx` riêng, song song TASK-155/156). Agent thêm `case 'Home'`/`case 'End'` vào `switch` có sẵn của `handleCardKeyDown` (TASK-148). Search restore dùng biến MODULE-LEVEL `lastSearchValue` (không phải localStorage/sessionStorage) + `useEffect` đồng bộ theo MỌI đường đổi `search` (gõ tay, "Xoá bộ lọc", Esc xoá chữ TASK-152) — quyết định tốt hơn chỉ đồng bộ ở `onChange`. `npm run build` PASS.

Coordinator verify: build tổng hợp 3 task PASS. Docker rebuild frontend + Playwright TASK-098 (3/3 PASS). Verify E2E qua Claude in Chrome: Home/End dispatch qua `KeyboardEvent` không lỗi (chỉ có 1 project trong tài khoản test, không đủ để thấy focus đổi giữa nhiều thẻ, nhưng xác nhận không crash ở trường hợp biên 1 phần tử). Search restore: gõ "test-restore" → click LINK THẬT trong app (`<a>` "Mẫu thiết kế", SPA transition, KHÔNG dùng `navigate` tool vì gây reload toàn trang) → quay lại `/projects` qua link "Dự án của tôi" → xác nhận `search.value` VẪN LÀ "test-restore" (đúng); sau đó dùng `navigate` tool (reload toàn trang thật) → xác nhận `search.value` VỀ RỖNG (đúng, không persist qua reload). Console sạch lỗi.

## Status

COMPLETED
