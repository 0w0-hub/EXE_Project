# TASK-052

## Title

Cảnh báo mềm (viền đỏ) khi kéo 1 món đè lên món khác

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Bố trí tự động (`resolveFurniturePositions`) đã có lưới an toàn chống chồng lấn (TASK-032/037), nhưng khi user TỰ KÉO 1 món bằng tay (TASK-004) thì không có cảnh báo nào nếu vô tình thả đè lên món khác. Thêm gợi ý trực quan (không chặn thao tác — vẫn giữ triết lý kéo-thả tự do) để user nhận biết ngay khi đang kéo.

## Scope

- `Room3DViewer.jsx`: thêm hàm `overlapsAnother(mesh)` — kiểm tra chồng lấn 2D (trục x/z, bỏ qua góc xoay để đơn giản, cùng mức độ chính xác với thuật toán tự động) giữa 1 mesh và mọi mesh khác trong `draggables`.
  - Trong nhánh đang kéo của `onPointerMove`: sau khi cập nhật vị trí, gọi `overlapsAnother(dragging)` — nếu `true`, đổi màu viền hover (`hoverOutline.material.color`) sang đỏ (`0xc4433d`, khớp `--color-danger`); ngược lại giữ trắng.
  - Nhánh hover thường (không kéo): luôn đặt lại màu trắng — cảnh báo chỉ có ý nghĩa TRONG LÚC kéo, không áp dụng cho món đã đặt sẵn đang bị hover thông thường.

## Out of scope

- Không chặn thả đè (user vẫn có thể cố ý đặt sát/chồng nhẹ nếu muốn — nhất quán với việc kéo-thả tự do từ đầu, TASK-004).
- Không tính đến góc xoay khi kiểm tra chồng lấn (coi mọi món là hộp thẳng trục) — đơn giản, đủ dùng cho cảnh báo trực quan.
- Không cảnh báo cho món ĐÃ ĐẶT SẴN (chỉ áp dụng lúc đang kéo chủ động).

## Dependencies

TASK-004 (kéo-thả cơ bản), TASK-035 (hạ tầng viền hover dùng chung).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Kéo 1 món chồng lên món khác → viền hover đổi màu đỏ trong lúc kéo (không chặn thả).
- Kéo ra vị trí không chồng lấn → viền hover về màu trắng bình thường.
- Hover (không kéo) không bị ảnh hưởng — vẫn luôn màu trắng.
- Không hồi quy: kéo-thả vẫn di chuyển đúng, nhấp chọn/xoay/xoá vẫn hoạt động.
- Console sạch lỗi.

## Testing

- Verify logic thuần qua Node: kiểm tra hàm AABB overlap (cùng công thức với `overlapsAnother`) với 5 kịch bản (trùng vị trí, cách xa, chạm biên đúng khít, chồng nhẹ, chỉ trùng 1 trục) — cả 5 đều cho kết quả đúng như kỳ vọng.
- Verify E2E qua Docker + browser thật (job "Phòng khách" có sẵn): kéo sofa đè lên vị trí kệ/tủ (`left_click_drag`) → xác nhận qua screenshot vị trí thật sự chồng lấn (sofa nằm lấn vào footprint kệ); "Đặt lại bố trí" khôi phục đúng vị trí gốc; console sạch lỗi xuyên suốt.
- **Giới hạn đã biết khi verify**: không thể chụp màn hình NGAY GIỮA lúc đang kéo (công cụ tự động hoá chỉ có `left_click_drag` là 1 thao tác nguyên khối gồm nhấn-kéo-thả, không có API tách riêng mousedown/mousemove/mouseup để chèn screenshot ở giữa) — nên KHÔNG xác nhận trực tiếp được màu đỏ hiển thị đúng lúc đang kéo qua ảnh chụp. Bù lại bằng: (1) xác nhận độc lập công thức AABB đúng 100% qua 5 kịch bản Node, (2) xác nhận đoạn code gọi `hoverOutline.material.color.set(...)` nằm đúng trong nhánh `onPointerMove` đã chạy ổn định mỗi frame kéo từ TASK-004 (cùng vị trí với dòng cập nhật `position.x`/`position.z` đã verify hoạt động đúng qua screenshot vị trí cuối cùng), (3) console sạch lỗi trong suốt thao tác kéo thật.

## Status

COMPLETED
