# TASK-044

## Title

Đèn sàn/đèn bàn phát sáng ấm khi bật chế độ Buổi tối

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). TASK-043 mới đổi ánh sáng TOÀN CỤC (nền + đèn hướng chung) khi bật "Buổi tối" — món nội thất category "lighting" (đèn sàn/đèn bàn) chưa thực sự trông như đang "được bật lên". Thêm điểm sáng ấm tại đúng vị trí từng món đèn để tăng cảm giác chân thực.

## Scope

- `Room3DViewer.jsx`: trong vòng lặp dựng từng món nội thất, nếu `isEvening` và `item.category` là `lighting`, thêm 1 `THREE.PointLight` màu vàng ấm (`0xffcf8a`, cường độ 1.1, tầm chiếu 3.2m, decay 2) tại vị trí `(x, size.h * 0.85, z)` — gần đỉnh đèn thay vì gốc, giống ánh sáng phát ra từ chao đèn.
- Dùng chung dữ liệu `x`/`z`/`size` đã có sẵn trong vòng lặp — không cần logic vị trí mới.

## Out of scope

- Không đổi hành vi ban ngày — point light chỉ tồn tại khi `isEvening === true`.
- Không thêm hiệu ứng lens flare/halo phức tạp — chỉ point light đơn giản, đủ tạo cảm giác "đèn đang sáng" mà không tốn thêm chi phí render đáng kể.
- Không phân biệt đèn sàn/đèn bàn/đèn trần (đều dùng category `lighting` chung theo dữ liệu AI) — cùng 1 cách xử lý cho mọi biến thể model.

## Dependencies

TASK-043 (chế độ Buổi tối) — tính năng này chỉ có tác dụng khi `lightingMode === 'evening'`.

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Bật "Buổi tối" + phòng có món category `lighting` → vùng quanh đèn sáng rõ rệt hơn các mảng tường khác (glow ấm).
- Bật lại "Ban ngày" → không còn glow thừa, ánh sáng trở về trạng thái trung tính ban đầu.
- Console sạch lỗi.

## Testing

Verify E2E qua Docker + browser thật (đăng nhập lại tài khoản đã có vì JWT hết hạn giữa round, job "Phòng tắm" có sẵn món "Đèn sàn/đèn trang trí"):
- Bật "🌙 Buổi tối" → zoom screenshot khu vực đèn xác nhận có vùng sáng ấm rõ rệt quanh đèn, khác biệt với phần tường còn lại.
- Bật lại "☀️ Ban ngày" → zoom screenshot cùng khu vực xác nhận không còn glow, ánh sáng đồng đều trở lại.
- Console sạch lỗi xuyên suốt cả 2 lần chuyển đổi.

## Status

COMPLETED
