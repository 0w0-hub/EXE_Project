# TASK-152

## Title

Đếm số kết quả tìm kiếm + Esc xoá nội dung tìm kiếm trên Projects

## Goal

Gộp 2 ý tưởng từ ChatGPT round 30 (hỏi lần 7 trong cùng phiên chat), đã vét trước qua Explore agent — cả 2 đều CHƯA CÓ, cùng đụng `Projects.jsx`:

- "Search Result Counter" — đang gõ tìm kiếm → hiện nhỏ "Tìm thấy X project" (chỉ dùng số lượng `filteredItems`/`displayItems` đã có ở frontend, không cần API mới).
- "Search Esc Clear" — ô tìm kiếm đang focus VÀ có nội dung → Esc xoá nội dung tìm kiếm (thay vì chỉ bỏ focus như hiện tại từ TASK-150); ô tìm kiếm đang focus nhưng ĐÃ TRỐNG → Esc vẫn bỏ focus như cũ (không đổi hành vi khi không có gì để xoá).

Đã đọc code TASK-150 hiện có (`Projects.jsx` dòng ~224-247): `useEffect` xử lý cả "/" và Esc trong 1 listener, nhánh Esc hiện tại CHỈ gọi `blur()`, không đụng `search` state — mở rộng sạch, không xung đột.

## Scope

- `frontend/src/pages/Projects.jsx`:
  - Dòng nhỏ "Tìm thấy X project" (số ít/nhiều tuỳ ngữ pháp tiếng Việt không bắt buộc phân biệt) hiện NGAY DƯỚI ô tìm kiếm, CHỈ khi `search` khác rỗng — không hiện khi chưa gõ gì (tránh nhiễu UI mặc định).
  - Sửa nhánh `Escape` trong `useEffect` đã có (TASK-150): nếu `search` khác rỗng → `setSearch('')` (KHÔNG blur, chỉ xoá chữ, giữ focus để gõ tiếp ngay); nếu `search` đã rỗng → `blur()` như hành vi cũ (không đổi).

## Out of scope

- Không đổi cơ chế filter/normalize tìm kiếm hiện có.
- Không đụng phím "/" đã có từ TASK-150.

## Dependencies

`Projects.jsx` (`search` state, `useEffect` phím tắt từ TASK-150, `filteredItems`/`displayItems` đã có).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Gõ vào ô tìm kiếm → dòng "Tìm thấy X project" hiện đúng số, cập nhật theo thời gian thực.
- Xoá hết chữ trong ô tìm kiếm → dòng đếm biến mất (không hiện "Tìm thấy 0 project" gây nhiễu khi rỗng — CHỈ áp dụng khi `search` khác rỗng theo Scope).
- Ô tìm kiếm có chữ + đang focus → Esc → chữ bị xoá, ô tìm kiếm VẪN giữ focus (kiểm tra `document.activeElement` không đổi).
- Ô tìm kiếm rỗng + đang focus → Esc → mất focus (hành vi cũ từ TASK-150 không đổi).
- Không hồi quy: phím "/" (TASK-150), filter/sort/view mode, menu "⋮"/"Mở nhanh" (TASK-147/148).
- Console sạch lỗi.

## Testing

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`). Coordinator gộp rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome cùng lúc với TASK-153.

## Coordinator verification

Dispatch cho 1 agent (`Projects.jsx` riêng, song song TASK-153 trên `RoomNew.jsx`). **Agent tự phát hiện + sửa 1 lỗi thật ngay lúc code (stale closure)**: `useEffect` phím tắt từ TASK-150 dùng dependency array rỗng `[]`, nếu giữ nguyên thì closure của nhánh Esc luôn thấy `search` ở giá trị RỖNG lúc mount (không bao giờ thấy giá trị mới) — sửa bằng cách đổi deps thành `[search]`, đúng pattern các effect khác trong cùng file (`openMenuJobId`/`previewJobId`) vốn cũng re-subscribe theo state đổi. `npm run build` PASS.

Coordinator verify: build tổng hợp 2 task PASS. Docker rebuild frontend + Playwright TASK-098 (3/3 PASS). Verify E2E qua Claude in Chrome: gõ tìm kiếm → "Tìm thấy 1 project" hiện đúng; Esc lần 1 (có chữ) → xoá chữ, GIỮ focus; Esc lần 2 (đã rỗng) → mới blur. Console sạch lỗi.

## Status

COMPLETED
