# TASK-034

## Title

Xoay nội thất 90°, góc nhìn nhanh (từ trên/đặt lại), đường kích thước trên sơ đồ 2D

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Round này tập trung vào tương tác/điều khiển thay vì thêm loại đồ mới (đã làm nhiều ở TASK-031/033): cho phép xoay nội thất, thêm 2 nút góc nhìn nhanh cho 3D, thêm đường kích thước (dimension line) chuẩn bản vẽ cho sơ đồ 2D.

## Scope

`frontend/src/components/Room3DViewer.jsx`:

- **Xoay nội thất**: nhấp đúp 1 món (`dblclick` trên canvas, raycast vào `draggables` — dùng lại đúng hạ tầng raycasting có sẵn) xoay 90° quanh trục Y. Cùng mức "chỉ trong phiên xem" như kéo-thả đổi vị trí — không lưu, mất khi scene dựng lại vì lý do khác (đổi tab/màu/kích thước phòng).
- **Góc nhìn nhanh**: 2 nút "⬆ Nhìn từ trên" (top-down) và "↺ Đặt lại góc nhìn" (về đúng góc mặc định lúc mới dựng scene) — thêm `cameraRef`/`controlsRef`/`defaultViewRef` để thao tác trực tiếp camera/controls đang chạy, không cần rebuild lại toàn bộ scene (nhẹ hơn, tức thời).
- **Đường kích thước sơ đồ 2D** (`Room2DPlan`, TASK-031): thêm đường kích thước kiểu bản vẽ kỹ thuật (tick mark 2 đầu + đường kẻ + nhãn mét) cho chiều rộng (dưới) và chiều dài (phải), thay vì chỉ ghi số trong đoạn caption text.

## Out of scope

- Không lưu góc xoay nội thất vào dữ liệu (giống mọi tương tác kéo-thả khác trong `Room3DViewer` — chỉ ảnh hưởng phiên xem).
- Không thêm góc nhìn "từ trước"/"từ bên" (chỉ 2 nút cơ bản nhất, đủ dùng; có thể thêm sau nếu cần).

## Dependencies

TASK-033 (COMPLETED, cùng đợt tự động nâng cấp).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Nhấp đúp 1 món nội thất → xoay đúng 90° (quan sát được qua hình dạng đổi từ ngang sang dọc), không ảnh hưởng kéo-thả đổi vị trí (event riêng biệt, không xung đột).
- "Nhìn từ trên" → camera chuyển đúng góc top-down; "Đặt lại góc nhìn" → về đúng góc mặc định ban đầu.
- Sơ đồ 2D hiện đúng đường kích thước + nhãn mét khớp kích thước phòng thật.
- Không hồi quy: kéo-thả, kéo-resize, tab 2D/3D/sơ đồ, thêm/xoá nội thất, bảng chọn màu.
- Console sạch lỗi.

## Testing

- `npm run build` PASS, Docker rebuild `frontend`.
- Verify qua browser thật (job `1cb66743-...`):
  - Nhấp đúp vào sofa → zoom xác nhận hình dạng xoay 90° đúng (từ nằm ngang sang chiều dọc).
  - Click "Nhìn từ trên" → screenshot xác nhận đúng góc top-down, thấy rõ toàn bộ bố cục phòng từ trên.
  - Click "Đặt lại góc nhìn" → screenshot xác nhận về đúng góc mặc định (giống lúc mới tải trang).
  - Chuyển sang "Sơ đồ mặt bằng" → xác nhận đường kích thước hiện đúng "5.0m" cả 2 chiều, khớp phòng thật (job này đang ở 5×5m).
  - `read_console_messages(onlyErrors=true)` sạch lỗi xuyên suốt.

## Status

COMPLETED
