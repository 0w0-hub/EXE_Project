# TASK-164

## Title

Nút "×" xoá riêng từng trường văn bản trong form tạo phòng

## Goal

Ý tưởng từ ChatGPT round 34, đã vét trước qua Explore agent, xác nhận CHƯA CÓ (chỉ có "🧹 Xoá thiết lập" TASK-149 xoá TOÀN BỘ form, khác hẳn phạm vi task này — xoá RIÊNG 1 trường). Không có class CSS nút-icon-nhỏ nào sẵn để tái dùng — cần thêm mới (nhẹ, style theo design token có sẵn, không cần thư viện).

- **Xoá riêng từng trường**: với các trường văn bản có nội dung (`style`, `preferredColors`, `desiredFurniture`, `budget`, `freeTextRequest`), thêm nút "×" nhỏ cạnh mỗi trường để xoá RIÊNG trường đó, không đụng các trường khác.

## Scope

- `frontend/src/pages/RoomNew.jsx`:
  - Thêm nút "×" nhỏ (chỉ HIỆN khi trường đang có nội dung, ẩn khi trống) cạnh 5 trường: `style`, `preferredColors`, `desiredFurniture`, `budget`, `freeTextRequest`. Bấm → gọi `update(field, '')` (hàm `update` hiện có) để xoá riêng trường đó, focus lại vào input sau khi xoá.
  - Thêm 1 class CSS nhỏ (vd `.field-clear-btn`) trong `frontend/src/styles.css` — nút tròn/nhỏ, dùng màu `text-muted`/border hiện có, không thêm màu mới.

## Out of scope

- Không đụng "🧹 Xoá thiết lập" (TASK-149, xoá TOÀN form) — 2 tính năng độc lập, khác phạm vi rõ ràng.
- Không thêm validate JS mới, không đụng `maxLength`/đếm ký tự (TASK-158).
- Không áp dụng cho `roomType` (chọn qua nút bấm, không phải text field) hay `widthMeters`/`lengthMeters` (số, đã có hành vi riêng TASK-153).

## Dependencies

`RoomNew.jsx` (`form` state, hàm `update` hiện có).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Gõ nội dung vào ô "Phong cách mong muốn" → nút "×" xuất hiện cạnh ô. Bấm → CHỈ ô đó bị xoá, các trường khác giữ nguyên nội dung.
- Trường đang trống → không hiện nút "×".
- Áp dụng đúng cho cả 5 trường: style/preferredColors/desiredFurniture/budget/freeTextRequest.
- Không hồi quy: "🧹 Xoá thiết lập" (TASK-149), đếm ký tự (TASK-158), Enter chuyển field (TASK-153), submit form chính.
- Console sạch lỗi.

## Testing

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`/`Projects.jsx`/`ChangePassword.jsx`). Coordinator gộp rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome cùng lúc với TASK-163/165.

## Coordinator verification

Dispatch cho 1 background agent, không đụng `Room3DViewer.jsx`/`Projects.jsx`/trang Đổi mật khẩu. Agent bọc cả 5 trường trong `.field-with-clear`, nút "×" chỉ hiện khi trường có nội dung, gọi `clearField(field, el)` (mới, dựa trên `update()` có sẵn) rồi focus lại đúng input/textarea. Dùng layout flex-row (không absolute-position trong input) để tránh đè lên spinner số của `budget` (`type="number"`).

`npm run build` PASS. Docker rebuild + Playwright TASK-098 regression: 3/3 PASS ngay lần đầu.

Verify E2E qua Claude in Chrome: gõ vào ô "Phong cách mong muốn" → nút "×" xuất hiện đúng (trước đó ẩn khi trống). Gõ thêm vào ô "Màu sắc mong muốn" (khác), bấm "×" trên ô Phong cách → CHỈ ô Phong cách bị xoá về rỗng, ô Màu sắc GIỮ NGUYÊN nội dung — xác nhận độc lập đúng giữa các trường. Focus tự động quay lại đúng input vừa xoá. Console sạch lỗi.

## Status

COMPLETED
