# TASK-041

## Title

Nhân đôi 1 món nội thất có sẵn trong danh sách

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Sau khi thêm khả năng chọn/xoá bằng bàn phím (TASK-040), thêm nốt thao tác còn thiếu để hoàn thiện bộ CRUD cơ bản cho danh sách nội thất tạm thời: nhân đôi 1 món có sẵn (kể cả món AI gốc) — hữu ích khi user muốn thêm 1 món giống hệt (vd 2 ghế giống nhau) mà không cần bấm lại preset "+ Ghế/sofa" (preset luôn có cùng 1 tên/giá cố định, không phải bản sao của món cụ thể đang có).

## Scope

- `Room3DViewer.jsx`: thêm `duplicateFurniture(index)` — nhân bản `localFurniture[index]`, đặt tên `"{tên gốc} (bản sao)"` (thay thế hậu tố cũ nếu nhân đôi nhiều lần liên tiếp, tránh lặp `(bản sao) (bản sao)`), đánh dấu `isCustom: true` để không nhầm với dữ liệu AI thật (nhất quán nguyên tắc "(mới thêm)" của `addFurniture`). Dùng lại nguyên `category`/`position` text của món gốc — vị trí mới được `resolveFurniturePositions` tự tính và tách khỏi bản gốc qua cơ chế chống chồng lấn có sẵn (TASK-032/037), không cần logic đặt vị trí riêng.
- Thêm nút "⧉" (nhân đôi) cạnh nút "✕" (xoá) trong mỗi dòng của "Nội thất trong phòng".
- `styles.css`: `.room3d-furniture-duplicate` — cùng kiểu icon-button với `.room3d-furniture-remove`, đổi màu `--color-primary` để phân biệt hành động.

## Out of scope

- Không nhân đôi kèm theo vị trí/xoay đã chỉnh tay (TASK-034/040) của món gốc — bản sao luôn dùng lại `position` TEXT gốc (heuristic), không phải toạ độ x/z hiện tại trong scene 3D (vị trí hiện tại trong scene chỉ tồn tại trong Three.js, không có trong `localFurniture` state).
- Không giới hạn số lần nhân đôi.

## Dependencies

TASK-037 (lưới an toàn chống chồng lấn — bản sao dựa vào cơ chế này để không đè lên bản gốc).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Bấm nút "⧉" ở 1 dòng bất kỳ → thêm đúng 1 bản sao ở cuối danh sách, tên có hậu tố "(bản sao)", không đổi món gốc.
- Bản sao không chồng lấn với món gốc trong scene 3D lẫn sơ đồ 2D.
- "Đặt lại bố trí" xoá đúng bản sao, khôi phục về danh sách AI gốc.
- Console sạch lỗi.

## Testing

Verify E2E qua Docker + browser thật (đăng nhập lại tài khoản đã có vì JWT hết hạn giữa round, job "Phòng tắm" từ TASK-039/040):
- Bấm "⧉" ở dòng "Sofa/giường chính" → `querySelectorAll` xác nhận có thêm "Sofa/giường chính (bản sao)" ở cuối danh sách, 4 dòng còn lại không đổi.
- Chuyển tab "Sơ đồ mặt bằng" → JS đọc trực tiếp toạ độ `<rect>` xác nhận 5 món, 0 cặp chồng lấn (2 hình chữ nhật tím "Sofa" tách biệt rõ trong screenshot).
- "Đặt lại bố trí" → khôi phục đúng về 4 món AI gốc, bản sao biến mất.
- Console sạch lỗi xuyên suốt.

## Status

COMPLETED
