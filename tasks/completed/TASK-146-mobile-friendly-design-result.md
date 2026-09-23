# TASK-146

## Title

Tối ưu trang Kết quả thiết kế (`DesignResult.jsx`) cho màn hình điện thoại

## Goal

Ý tưởng từ ChatGPT round 26 (cùng batch TASK-144/145). Đã vét trước qua Explore agent, xác nhận CHƯA CÓ: `DesignResult.jsx`/`styles.css` không có `@media` nào riêng cho trang này (chỉ có 3 media query toàn site ở dòng 572/583/1313, không đụng class nào của trang kết quả) — trang kế thừa layout desktop-first, hàng nút hành động dùng `flexWrap` ngầm từ cha chứ không có rule stack riêng cho mobile.

- **Mobile-friendly**: thêm `@media (max-width: 640px)` riêng cho các khối chính của `DesignResult.jsx` — ảnh Trước/Sau chiếm đủ chiều rộng, hàng nút hành động (Chia sẻ/Tải PDF/Tóm tắt/Nhân bản/Đặt lịch nhắc) xếp thành cột hoặc lưới 2 cột thay vì tràn ngang, cỡ chạm đủ lớn (tối thiểu ~44px chiều cao nút, đúng chuẩn tap-target phổ biến).

## Scope

- `frontend/src/styles.css`: thêm `@media (max-width: 640px)` mới, nhắm đúng các class đang dùng ở `DesignResult.jsx` (đọc kỹ class name thật trước khi viết CSS, không đoán tên) — khối Trước/Sau, hàng nút hành động, khối "Kiểm tra thiết kế"/"Phương án decor"/quick-note.
- Có thể cần thêm/đổi vài className trong `DesignResult.jsx` nếu hiện tại dùng thuần inline style (`style={{ display: 'flex', gap: 8 }}` ở hàng nút — đọc kỹ trước khi sửa, chuyển sang class nếu cần để `@media` áp dụng được).

## Out of scope

- Không đổi logic/dữ liệu hiển thị — thuần CSS/responsive.
- Không đụng `Room3DViewer.jsx` (đã có toolbar 3D riêng, không thuộc phạm vi trang kết quả tổng).
- Không đổi layout desktop hiện có (chỉ thêm nhánh mobile).

## Dependencies

`pages/DesignResult.jsx`, `styles.css` (3 media query hiện có ở dòng 572/583/1313 làm tham khảo pattern).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Ở viewport hẹp (≤640px, dùng `resize_window` hoặc DevTools mobile emulation qua Claude in Chrome): ảnh Trước/Sau full-width, hàng nút hành động xếp cột/lưới thay vì tràn ngang/cuộn ngang.
- Ở desktop (viewport bình thường): layout GIỮ NGUYÊN y hệt trước khi sửa (không hồi quy).
- Console sạch lỗi.

## Testing

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`). Coordinator gộp rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome (cả 2 viewport) cùng lúc với TASK-144/145.

## Coordinator verification

Dispatch cho 1 background agent (không đụng `Room3DViewer.jsx`). Agent phát hiện đúng: hàng nút hành động dùng inline `style={{ display: 'flex', gap: 8 }}` — inline style luôn thắng CSS thường (không `!important`) nên PHẢI đổi sang class `.design-actions` mới `@media` có tác dụng được, đúng bài học đã ghi ở `.room3d-mount` trong `styles.css`. Thêm `className="design-result-page"` cho wrapper gốc để scope CSS mobile CHỈ trang này, không ảnh hưởng `.card` dùng chung toàn app. `@media (max-width: 640px)` mới (tách biệt 3 media query cũ ở dòng ~572/583/1313): card giảm padding, hàng nút xếp cột, `min-height: 44px` cho tap-target. `npm run build` PASS.

Coordinator verify: build tổng hợp 3 task PASS, đọc tail `styles.css` xác nhận cả block TASK-144 lẫn TASK-146 cùng tồn tại không đè lên nhau. Docker rebuild + Playwright TASK-098 (3/3 PASS). Verify E2E qua Claude in Chrome: đọc trực tiếp `document.styleSheets` xác nhận rule `@media (max-width: 640px) { .design-actions { flex-direction: column } ... }` ĐÃ triển khai đúng trong bundle thật, khớp `.design-actions`/`.design-result-page .card` đang tồn tại thật trong DOM (6 nút hành động). **Không xác nhận được bằng mắt qua đổi kích thước viewport thật** — `resize_window` tool không thực sự đổi `window.innerWidth` trong môi trường này (vẫn giữ nguyên độ rộng desktop dù gọi thành công) — hạn chế công cụ đã ghi Known Issue mới, xác nhận thay thế qua đọc stylesheet đã deploy thật + review code thay vì screenshot mobile trực tiếp. Desktop layout xác nhận KHÔNG đổi qua screenshot thật (hàng nút vẫn ngang, không hồi quy). Console sạch lỗi.

## Status

COMPLETED
