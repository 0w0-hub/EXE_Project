# TASK-071

## Title

Nút "Xoá món tự thêm" — xoá nhanh mọi món tự thêm/nhân đôi, giữ nguyên vị trí/màu món AI gốc

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). "Đặt lại bố trí" hiện có (từ TASK-028) là công cụ reset DUY NHẤT, nhưng nó xoá SẠCH mọi thay đổi kể cả màu tường/sàn/trần (TASK-020) và vị trí kéo-thả của chính món AI gốc — quá "mạnh tay" khi user chỉ muốn dọn bớt các món thử nghiệm tự thêm mà vẫn giữ nguyên phần đã ưng ý của bố cục AI gốc.

## Scope

- `Room3DViewer.jsx`: thêm hàm `removeAllCustom()` — lọc bỏ mọi item có `isCustom: true` (cờ đã có sẵn từ TASK-031/041, đánh dấu món tự thêm/nhân đôi) khỏi `localFurniture`, đồng thời dồn lại `itemColorOverrides` (TASK-049) và `selectedIndexRef` (TASK-049) theo index mới của các món CÒN LẠI — cùng nguyên tắc remap đã dùng trong `removeFurniture` (TASK-049) nhưng áp dụng cho NHIỀU món cùng lúc thay vì 1 món.
- Thêm nút "🧹 Xoá món tự thêm" cạnh nút "Đặt lại bố trí" — chỉ hiện khi `localFurniture` có ít nhất 1 món `isCustom` (ẩn hoàn toàn khi không có gì để xoá, tránh nút vô dụng).

## Out of scope

- Không đổi hành vi "Đặt lại bố trí" hiện có — 2 nút cùng tồn tại song song, phục vụ 2 mức độ reset khác nhau (nhẹ: chỉ xoá món tự thêm; mạnh: xoá sạch mọi thay đổi).
- Không thêm xác nhận (confirm dialog) trước khi xoá — nhất quán với nút xoá từng món "✕" hiện có (TASK-028) cũng không có xác nhận, và đã có "↺ Hoàn tác xoá" (TASK-053) cho trường hợp xoá nhầm 1 món — quyết định KHÔNG mở rộng cơ chế hoàn tác cho xoá hàng loạt (phức tạp hoá không cần thiết cho 1 thao tác ít khi lặp lại).

## Dependencies

TASK-031/041 (cờ `isCustom`), TASK-049 (cơ chế remap `itemColorOverrides`/`selectedIndexRef` theo index mới — tái sử dụng logic, mở rộng cho nhiều món).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Có ít nhất 1 món tự thêm → nút "🧹 Xoá món tự thêm" hiện; bấm vào xoá đúng TOÀN BỘ món `isCustom`, giữ nguyên món AI gốc (kể cả màu đã nhuộm riêng, vị trí đã kéo-thả).
- Không có món tự thêm nào → nút tự ẩn.
- Console sạch lỗi.

## Testing

Verify E2E qua Docker + browser thật (tài khoản `task062-tester`, re-login vì JWT + backend restart giữa round):
- Thêm "Đài radio" (món tự thêm) → chọn "Sofa/giường chính" (món AI gốc) → nhuộm màu xanh dương đậm (`#4D52B4`) → xác nhận qua screenshot sofa đổi màu đúng.
- Bấm "🧹 Xoá món tự thêm" → JS xác nhận danh sách quay về đúng 4 món AI gốc (mất "Đài radio"); screenshot xác nhận sofa VẪN giữ màu xanh dương đậm đã nhuộm (không bị reset theo).
- JS xác nhận nút "Xoá món tự thêm" tự ẩn sau khi không còn món tự thêm nào.
- Console sạch lỗi xuyên suốt.

## Status

COMPLETED
