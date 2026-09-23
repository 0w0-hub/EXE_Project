# TASK-063

## Title

Nút ẩn/hiện nhãn tên + giá nổi trên mỗi món nội thất

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Sau nhiều round thêm loại đồ liên tiếp, phòng hiện có thể chứa tới 30 category khác nhau cùng lúc (4 AI cố định + 26 loại tự thêm tính đến TASK-062). Mỗi món đều có nhãn tên+giá nổi phía trên (TASK-025) — khi phòng có nhiều món, các nhãn dễ chồng chéo lên nhau gây rối mắt, đặc biệt khi xem tổng thể hoặc chụp ảnh scene. Thêm nút bật/tắt toàn bộ nhãn.

## Scope

- `Room3DViewer.jsx`: thêm state `showLabels` (mặc định `true`, thêm vào dependency array của effect dựng scene).
- Trong vòng lặp tạo mesh nội thất: chỉ gọi `makeLabelSprite`/`scene.add(label)` khi `showLabels === true`; `mesh.userData.label` giữ nguyên `undefined` khi tắt (2 chỗ đọc `userData.label` để cập nhật vị trí lúc kéo/xoay đã dùng optional chaining `?.` từ trước, không cần sửa thêm).
- Thêm nút "🏷️ Ẩn nhãn"/"🏷️ Hiện nhãn" vào hàng công cụ tab 3D, cạnh nút "❓ Phím tắt" (TASK-061).

## Out of scope

- Không đổi nội dung/kiểu dáng nhãn (`makeLabelSprite`) — chỉ thêm cơ chế ẩn/hiện toàn bộ.
- Không cho ẩn/hiện nhãn TỪNG món riêng lẻ (chỉ toggle tất cả cùng lúc) — đủ dùng cho mục tiêu giảm rối mắt tổng thể.

## Dependencies

TASK-025 (nhãn nổi gốc), TASK-049/054 (cơ chế `selectedIndexRef` giữ selection qua rebuild scene — tái sử dụng vì bật/tắt nhãn cũng làm rebuild toàn bộ scene).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Bấm "🏷️ Ẩn nhãn" → toàn bộ nhãn tên+giá biến mất khỏi scene, nút đổi thành "🏷️ Hiện nhãn"; bấm lại → nhãn hiện lại đầy đủ.
- Món đang chọn (viền primary, TASK-040) không bị mất khi bật/tắt nhãn (rebuild scene vẫn giữ đúng selection nhờ `selectedIndexRef`).
- Console sạch lỗi.

## Testing

Verify E2E qua Docker + browser thật (tài khoản `task062-tester`, job "Phòng bếp test 062"):
- Bấm "🏷️ Ẩn nhãn" → screenshot xác nhận toàn bộ nhãn biến mất, hình khối nội thất vẫn nguyên vẹn; nút đổi đúng thành "🏷️ Hiện nhãn".
- Bấm lại → screenshot xác nhận nhãn hiện lại đầy đủ như ban đầu.
- Chọn "Kệ/tủ lưu trữ" → JS xác nhận `li.is-selected` đúng món; bấm "Ẩn nhãn" → JS xác nhận `li.is-selected` VẪN đúng món cũ (không bị mất selection qua rebuild).
- Console sạch lỗi xuyên suốt.

## Status

COMPLETED
