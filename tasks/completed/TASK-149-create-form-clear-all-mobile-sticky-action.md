# TASK-149

## Title

Nút "Xoá thiết lập" cho form tạo phòng + Nút hành động chính dính khi cuộn trên mobile

## Goal

2 ý tưởng từ ChatGPT round 28 (cùng batch TASK-148), đã vét trước qua Explore agent — cả 2 đều CHƯA CÓ:

- "Create Form Clear All" — `RoomNew.jsx` chỉ có "Khôi phục/Bỏ qua" (đụng đúng bản nháp đã lưu, TASK-095) và "✕ Bỏ ảnh" (chỉ xoá ảnh) — CHƯA có nút xoá TOÀN BỘ input hiện tại (loại phòng, kích thước, phong cách, màu, nội thất mong muốn, ngân sách, yêu cầu tự do) về mặc định.
- "Mobile Sticky Primary Action" — không có `position: sticky`/`fixed` nào cho nút hành động chính trong toàn bộ `styles.css` (3 `position: fixed` hiện có đều là thứ khác — `.compare-fab`, lightbox, onboarding overlay). Nút submit "Tạo thiết kế" ở cuối form `RoomNew.jsx` cuộn mất khỏi màn hình như mọi nội dung khác trên mobile.

## Scope

- `frontend/src/pages/RoomNew.jsx`:
  - **Xoá thiết lập**: nút "🧹 Xoá thiết lập" (đặt cạnh nút "Khôi phục"/"Bỏ qua" nếu đang hiện banner, hoặc ở cuối form) — reset toàn bộ state `form` về giá trị mặc định ban đầu (đọc đúng shape khởi tạo `useState` hiện có, không đoán field). Có xác nhận nhẹ (`window.confirm`, đúng pattern đã dùng ở `Trash.jsx:51`) CHỈ KHI form đang có dữ liệu khác mặc định (tránh hỏi vô ích khi form đang trống). KHÔNG đụng logic `useDraftAutosave`/bản nháp đã lưu trong `localStorage` (xoá form hiện tại ≠ xoá bản nháp đã lưu — đây là 2 khái niệm khác, giữ tách biệt đúng như "Khác Draft Recovery" ChatGPT tự phân biệt).
  - **Nút hành động chính dính khi cuộn (mobile)**: nút submit "Tạo thiết kế" (cuối form) — dùng `position: sticky` (không phải `fixed`, để không che nội dung khi ở desktop/không cuộn) CHỈ áp dụng trong `@media (max-width: 640px)` mới (đúng pattern TASK-146), `bottom: 0`, nền đục + `box-shadow` nhẹ để tách khỏi nội dung cuộn phía sau. Không đổi hành vi/vị trí nút ở desktop.

## Out of scope

- Không đụng `Projects.jsx`/`Dashboard.jsx`/`Room3DViewer.jsx`.
- Không đổi logic `useDraftAutosave`/banner khôi phục bản nháp đã có.
- Không thêm sticky action cho trang khác ngoài `RoomNew.jsx` (DesignResult đã có mobile CSS riêng từ TASK-146, phạm vi khác).

## Dependencies

`RoomNew.jsx` (state `form`, `useDraftAutosave` TASK-095, nút "✕ Bỏ ảnh" làm tham khảo), `styles.css` (pattern `@media (max-width: 640px)` mới từ TASK-146).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Điền vài trường trong form → bấm "Xoá thiết lập" → xác nhận (nếu có) → toàn bộ trường về mặc định/trống — kiểm tra qua đọc giá trị input thật.
- Form đang trống → bấm "Xoá thiết lập" → KHÔNG hiện hộp xác nhận (không có gì để hỏi).
- Bấm "Xoá thiết lập" KHÔNG xoá bản nháp `localStorage` đã lưu trước đó (reload lại trang vẫn còn banner khôi phục nếu có bản nháp cũ).
- Ở viewport hẹp (≤640px): nút "Tạo thiết kế" dính ở đáy màn hình khi cuộn qua nội dung form dài; ở desktop: vị trí/hành vi GIỮ NGUYÊN như cũ.
- Console sạch lỗi.

## Testing

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`/`Projects.jsx`). Coordinator gộp rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome cùng lúc với TASK-148.

## Coordinator verification

Dispatch cho 1 agent (`RoomNew.jsx` riêng, song song với TASK-148 trên `Projects.jsx`, không đụng chung file). Agent tách `buildDefaultForm(template)` từ khởi tạo `useState` gốc (tái dùng đúng, không lặp logic default), `defaultFormRef` chụp giá trị mặc định thật lúc mount, `isFormDefault()` so sánh trước khi quyết định có cần `window.confirm` hay không (đúng pattern `Trash.jsx:51`). CỐ TÌNH không đụng `photoFile`/`useDraftAutosave`/banner khôi phục bản nháp — đúng phạm vi task (2 khái niệm tách biệt). Mobile sticky: class `.room-new-page` scope theo đúng pattern `.design-result-page` (TASK-146), `@media (max-width: 640px)` MỚI tách riêng khối cũ, `position: sticky` (không phải `fixed`) + `var(--color-surface)` (tự thích ứng dark mode) + box-shadow. `npm run build` PASS.

Coordinator verify: build tổng hợp 2 task PASS. Docker rebuild + Playwright TASK-098 (3/3 PASS). Verify E2E qua Claude in Chrome: ghi đè `window.confirm` qua JS trước khi bấm (đúng pattern đã dùng ở TASK-092, tránh treo phiên điều khiển tự động bởi dialog native) — điền 1 trường (chiều rộng "4.5") → bấm "🧹 Xoá thiết lập" → `confirm` được gọi đúng 1 lần → trường về rỗng đúng; bấm lại lần 2 khi form đã trống → `confirm` KHÔNG được gọi (đúng yêu cầu không hỏi vô ích). Đọc trực tiếp `document.styleSheets` xác nhận rule `@media (max-width: 640px) { .room-new-page .room-new-submit-row {...} }` đã deploy đúng, khớp `.room-new-page`/`.room-new-submit-row` đang tồn tại thật trong DOM (không xác nhận bằng mắt qua đổi viewport — cùng hạn chế `resize_window` đã ghi Known Issue ở TASK-146). Đọc code xác nhận `handleRestoreDraft`/`handleDismissDraft`/`draftBanner` còn nguyên vẹn, không bị đụng. Console sạch lỗi.

## Status

COMPLETED
