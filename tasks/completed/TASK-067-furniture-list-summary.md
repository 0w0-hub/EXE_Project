# TASK-067

## Title

Tổng số món + tổng chi phí ước tính cho danh sách nội thất đang xem

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Danh sách "Nội thất trong phòng" (`localFurniture`) đã hỗ trợ thêm/xoá/nhân đôi/sửa giá (TASK-028/041/046/053) nhưng không có chỗ nào tổng hợp lại đang có bao nhiêu món và tổng chi phí ước tính là bao nhiêu — user phải tự cộng nhẩm từng dòng.

## Scope

- `Room3DViewer.jsx`: thêm 1 dòng tóm tắt `"{count} món · tổng ước tính {sum} đ"` ngay dưới tiêu đề "Nội thất trong phòng", tính trực tiếp từ `localFurniture` (tổng `estimatedCost` mọi món, gồm cả AI gốc lẫn tự thêm) — tự động cập nhật theo mọi thay đổi (thêm/xoá/nhân đôi/sửa giá/đặt lại bố trí) vì đọc thẳng từ state hiện có, không cần thêm state riêng.

## Out of scope

- Không đổi biểu đồ phân bổ ngân sách AI gốc ở phần trên trang (TASK-026) — biểu đồ đó cố tình KHÔNG đồng bộ theo thêm/xoá tạm thời (quyết định từ TASK-028), dòng tóm tắt mới này là một chỉ số RIÊNG cho danh sách đang xem, không thay thế hay đồng bộ với biểu đồ đó.
- Không thêm cảnh báo vượt ngân sách ở dòng tóm tắt này (đã có ở biểu đồ ngân sách gốc, tránh trùng lặp/nhầm lẫn 2 nguồn số liệu).

## Dependencies

TASK-028 (thêm/xoá tạm thời), TASK-046 (sửa giá tự thêm).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Dòng tóm tắt hiện đúng số món và đúng tổng chi phí khớp phép cộng thủ công.
- Thêm/xoá/sửa giá 1 món → số liệu cập nhật đúng ngay lập tức.
- "Đặt lại bố trí" → số liệu quay về đúng tổng của 4 món AI gốc.
- Console sạch lỗi.

## Testing

Verify E2E qua Docker + browser thật (tài khoản `task062-tester`, re-login vì JWT + backend restart giữa round, job "Phòng bếp test 062"):
- Trạng thái ban đầu (4 món AI gốc: 4.500.000 + 10.500.000 + 3.000.000 + 6.000.000) → xác nhận đúng "4 món · tổng ước tính 24.000.000 đ".
- Thêm "Đài radio" (900.000) → xác nhận đúng "5 món · tổng ước tính 24.900.000 đ".
- Sửa giá radio thành 1.500.000 (blur khỏi ô nhập) → xác nhận đúng "25.500.000 đ".
- "Đặt lại bố trí" → JS xác nhận quay lại đúng "4 món · tổng ước tính 24.000.000 đ".
- Console sạch lỗi xuyên suốt.

## Status

COMPLETED
