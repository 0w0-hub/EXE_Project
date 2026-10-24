# TASK-036

## Title

Sơ đồ mặt bằng 2D luôn in được (bất kể tab nào đang mở)

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Nhận thấy tính năng "In / Xuất PDF" (TASK-024) hiện ẩn TOÀN BỘ `Room3DViewer` khi in (kể cả sơ đồ mặt bằng 2D mới thêm ở TASK-031) — trong khi SVG sơ đồ 2D in tốt (khác canvas WebGL 3D vốn đã xác nhận in không đáng tin cậy). Sửa để bản in luôn có sơ đồ mặt bằng, không phụ thuộc user đang xem tab nào trên màn hình.

## Scope

- `Room3DViewer.jsx`: khối tương tác (nút chuyển tab + nội dung tab đang chọn) gói trong `<div className="no-print">` — thu hẹp phạm vi `no-print` từ "toàn bộ component" (cách cũ) xuống "chỉ phần tương tác". Thêm 1 khối MỚI luôn render (`<div className="room3d-print-plan"><Room2DPlan .../></div>`), ẩn trên màn hình qua CSS, chỉ hiện khi in.
- `DesignResult.jsx`: bỏ `no-print` bọc ngoài `<Room3DViewer>` (giờ tự quản lý bên trong); heading "Không gian 3D" ngay phía trên đánh dấu `no-print` riêng (không có nội dung 3D bên dưới khi in nên ẩn theo).
- `styles.css`: `.room3d-print-plan { display: none }` mặc định, `display: block` trong `@media print`.

## Out of scope

- Không thay đổi nội dung/logic của `Room2DPlan` — dùng lại y nguyên component đã có (TASK-031/034/035), chỉ render thêm 1 bản ẩn.
- Không cố gắng làm canvas 3D in được — giữ nguyên quyết định từ TASK-024 (không đáng tin cậy qua các trình duyệt).

## Dependencies

TASK-035 (COMPLETED, cùng đợt tự động nâng cấp).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Màn hình bình thường: không đổi hành vi (tab hoạt động như cũ, không có phần tử lạ hiện ra).
- Khối `.room3d-print-plan` luôn tồn tại trong DOM (bất kể tab nào đang chọn), `display: none` khi xem bình thường.
- Rule `@media print` chứa đúng `.room3d-print-plan { display: block }`.
- Không hồi quy: mọi tính năng `Room3DViewer` (tab, màu, thêm/xoá, xoay, góc nhìn, xuất ảnh...).
- Console sạch lỗi.

## Testing

- `npm run build` PASS, Docker rebuild `frontend`.
- Verify qua browser thật (job `1cb66743-...`, đang ở tab mặc định "Không gian 3D"):
  - Xác nhận qua JS: `.room3d-print-plan` tồn tại trong DOM, chứa đúng `svg.room2d-plan` bên trong, `computedStyle.display === 'none'` khi xem bình thường.
  - Xác nhận qua CSSOM (`document.styleSheets`): rule `@media print` có chứa `.room3d-print-plan{display:block}` (không thực sự mở dialog in thật — tránh treo phiên điều khiển tự động, đã ghi nhận từ TASK-024).
  - Chuyển qua tab "Sơ đồ mặt bằng" → xác nhận nút "Tải sơ đồ" + sơ đồ hiển thị bình thường trên màn hình (không bị ảnh hưởng bởi bản in ẩn song song).
  - `read_console_messages(onlyErrors=true)` sạch lỗi xuyên suốt.

## Status

COMPLETED
