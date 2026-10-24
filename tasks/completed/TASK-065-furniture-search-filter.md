# TASK-065

## Title

Ô tìm kiếm lọc danh sách nút "+ thêm loại đồ"

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Sau nhiều round thêm loại đồ liên tiếp, danh sách nút "+ thêm" đã lên tới 32 nút trải trên 5 nhóm (TASK-055). Dù đã gom nhóm, vẫn phải quét mắt qua nhiều nút để tìm đúng loại đồ cần thêm, nhất là khi không nhớ rõ loại đồ đó thuộc nhóm phòng nào. Thêm ô tìm kiếm lọc theo tên.

## Scope

- `Room3DViewer.jsx`: thêm hàm `normalizeSearch()` (bỏ dấu tiếng Việt qua `normalize('NFD')` + regex, cùng cách làm với `Projects.jsx#normalize` từ TASK-017) để tìm được không cần gõ đúng dấu (vd gõ "may" ra "Máy tính bàn"/"Máy pha cà phê"/"Máy hút mùi"/"Máy giặt").
- Thêm state `furnitureSearch`, ô `<input>` phía trên danh sách nhóm nút.
- Lọc `FURNITURE_GROUPS`/`OTHER_CATEGORIES` theo chuỗi tìm kiếm đã chuẩn hoá — nhóm nào không còn nút nào khớp thì ẩn luôn tiêu đề nhóm (không hiện nhóm rỗng); hiện thông báo "Không tìm thấy loại đồ nào khớp..." khi không có kết quả nào ở cả 5 nhóm lẫn "Khác".
- CSS mới `.room3d-furniture-search`.

## Out of scope

- Không đổi cơ chế `addFurniture`/dữ liệu — chỉ lọc hiển thị.
- Không thêm phím tắt "/" để focus nhanh vào ô tìm kiếm (có thể cân nhắc ở round sau nếu cần).

## Dependencies

TASK-055 (`FURNITURE_GROUPS`/`OTHER_CATEGORIES`), TASK-017 (tiền lệ hàm `normalize` bỏ dấu trong `Projects.jsx`).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Gõ "bàn" → chỉ hiện các nút có tên chứa "bàn" (ở đúng nhóm gốc).
- Gõ không dấu (vd "may") → vẫn khớp đúng các nút có dấu (vd "Máy tính bàn").
- Gõ chuỗi không khớp gì → hiện thông báo rõ ràng, không còn nút nào.
- Xoá hết ô tìm kiếm → toàn bộ 32 nút hiện lại đầy đủ, đúng nhóm như ban đầu.
- Console sạch lỗi.

## Testing

Verify E2E qua Docker + browser thật (tài khoản `task062-tester`, re-login vì JWT + backend restart giữa round):
- Gõ "may" (không dấu) → screenshot xác nhận chỉ còn 4 nút hiện ra ("Máy tính bàn" ở nhóm Phòng ngủ, "Máy hút mùi"/"Máy pha cà phê" ở Phòng bếp/ăn, "Máy giặt" ở Phòng tắm/giặt) — đúng cả nội dung lẫn nhóm gốc.
- Gõ "xyz123" (không khớp gì) → screenshot xác nhận hiện đúng thông báo `Không tìm thấy loại đồ nào khớp "xyz123".`, không còn nút nào.
- Xoá ô tìm kiếm → JS đếm `button.secondary` bắt đầu bằng "+" xác nhận đúng 32 nút quay lại đầy đủ.
- Console sạch lỗi xuyên suốt.

## Status

COMPLETED
