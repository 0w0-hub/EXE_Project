# TASK-046

## Title

Chỉnh sửa chi phí ước tính cho món nội thất tự thêm

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Các loại đồ tự thêm (TASK-028, mở rộng TASK-031→045) luôn có chi phí ước tính CỐ ĐỊNH theo preset (vd "Giường (mới thêm)" luôn 9.000.000đ), không phản ánh đúng nhu cầu thực tế của user (giường có thể rẻ/đắt hơn nhiều tuỳ sản phẩm họ định mua). Cho phép chỉnh sửa trực tiếp — chỉ áp dụng cho món tự thêm, KHÔNG cho món AI thật (giữ nguyên tắc "không bịa dữ liệu": chi phí AI là số liệu thật từ kết quả thiết kế, không được sửa).

## Scope

- `Room3DViewer.jsx`: thêm `updateFurnitureCost(index, cost)` cập nhật `estimatedCost` của đúng 1 món trong `localFurniture`.
- Trong "Nội thất trong phòng", nếu `item.isCustom`, hiện thêm 1 `<input type="number">` nhỏ gọn trước nút nhân đôi/xoá — dùng `defaultValue` + `onBlur` (không phải `onChange`) để tránh rebuild toàn bộ scene 3D (effect phụ thuộc `localFurniture`) trên MỖI phím gõ, chỉ commit khi rời khỏi ô nhập.
- `styles.css`: `.room3d-furniture-cost-input` — ô nhập nhỏ gọn vừa 1 dòng danh sách.

## Out of scope

- Không hiện ô nhập cho món AI thật (`!item.isCustom`) — bảng "Danh sách nội thất" (dữ liệu AI gốc, `job.result.furniture`) không bị ảnh hưởng, nhất quán với hành vi đã có (thêm/xoá/nhân đôi cũng chỉ tác động `localFurniture`, không đồng bộ ngược).
- Không validate giá trị âm phức tạp — chỉ `Math.max(0, ...)` đơn giản khi commit.

## Dependencies

TASK-028 (thêm/xoá tạm thời), TASK-041 (nhân đôi — bản sao giữ nguyên cost đã chỉnh của món gốc).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Món tự thêm có ô nhập chi phí; món AI gốc không có (giữ nguyên hiển thị text như cũ).
- Sửa giá trị + rời khỏi ô nhập (blur) → nhãn giá nổi trên món đó trong scene 3D cập nhật đúng, không rebuild scene trên từng phím gõ (không giật/mất focus khi đang gõ).
- "Đặt lại bố trí" xoá đúng món tự thêm (bao gồm cả giá đã chỉnh).
- Console sạch lỗi.

## Testing

Verify E2E qua Docker + browser thật (đăng nhập lại tài khoản đã có, job "Phòng tắm"):
- Thêm "Giường" → xác nhận ô nhập hiện giá trị mặc định `9000000`.
- Sửa thành `12500000`, click ra ngoài (blur) → zoom screenshot xác nhận nhãn 3D đổi đúng thành "12.500.000 đ".
- "Đặt lại bố trí" → `querySelectorAll` xác nhận danh sách về đúng 4 món AI gốc, không còn giường/giá đã chỉnh.
- Console sạch lỗi xuyên suốt.

## Status

COMPLETED
