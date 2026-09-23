# TASK-060

## Title

Đồng bộ món đang chọn giữa "Không gian 3D" và "Sơ đồ mặt bằng" 2D

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Hạ tầng "chọn 1 món" (TASK-040) hiện chỉ hiển thị trong tab "Không gian 3D" — chuyển qua tab "Sơ đồ mặt bằng" thì mất hết ngữ cảnh đang xem gì. Đồng bộ để món đã chọn tiếp tục được đánh dấu rõ ở cả 2 chế độ xem.

## Scope

- `Room2DPlan`: thêm prop `selectedIndex` — món khớp index được vẽ viền màu `--color-primary` dày 3px (khác hẳn viền đen mảnh 1px mặc định); câu chú thích dưới sơ đồ thêm 1 câu phụ nêu rõ tên món đang chọn khi có.
- Truyền `selectedIndexRef.current` (không phải state `selectedFurnitureIndex`) vào `Room2DPlan` khi ở tab `plan`.

## Lỗi thật phát hiện + sửa trong lúc tự verify

Lần đầu truyền `selectedFurnitureIndex` (state) vào `Room2DPlan` — verify bằng browser cho thấy KHÔNG có viền tím nào xuất hiện dù đã chọn món trước khi chuyển tab. Nguyên nhân: effect dựng scene 3D chỉ chạy khi `tab === '3d'`; cleanup của effect (chạy mỗi khi bất kỳ dependency nào đổi, kể cả chính `tab`) luôn gọi `setSelectedFurnitureIndex(null)` (thêm từ TASK-049 để tránh chọn nhầm sau khi rebuild). Khi chuyển sang tab `plan`, cleanup chạy nhưng effect mới KHÔNG chạy tiếp (do điều kiện `tab !== '3d'` return sớm) nên không có bước "tự chọn lại" (đã thêm ở TASK-049) để khôi phục — `selectedFurnitureIndex` bị kẹt ở `null` trong khi `selectedIndexRef.current` (ref, không bị cleanup đụng tới) vẫn giữ đúng giá trị. Sửa bằng cách đọc trực tiếp `selectedIndexRef.current` tại thời điểm render thay vì dựa vào state — ref không bị reset bởi cleanup, và việc chuyển tab tự nhiên đã kích hoạt 1 lần re-render để đọc giá trị mới nhất.

## Out of scope

- Không thêm khả năng click-to-select TRONG sơ đồ 2D (chỉ đồng bộ hiển thị 1 chiều từ 3D sang 2D) — nhấp vào SVG 2D để chọn nằm ngoài phạm vi round này.
- Không đồng bộ ngược lại khi tab `plan` bị bỏ chọn theo cách nào khác — hành vi bỏ chọn vẫn chỉ xảy ra từ tab 3D (nhấp chỗ trống/Delete) hoặc "Đặt lại bố trí".

## Dependencies

TASK-040 (hạ tầng chọn món), TASK-049 (`selectedIndexRef`, cơ chế tự chọn lại sau rebuild).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Chọn 1 món ở tab "Không gian 3D" → chuyển sang tab "Sơ đồ mặt bằng" → đúng món đó có viền tím đậm 3px, câu chú thích nêu đúng tên món.
- Chuyển lại tab "Không gian 3D" → selection vẫn đúng (không bị mất qua lại giữa 2 tab).
- "Đặt lại bố trí" xoá selection ở cả 2 tab.
- Console sạch lỗi.

## Testing

Verify E2E qua Docker + browser thật (phòng 1.5×5.0m có sẵn):
- Nhấp chọn "Kệ/tủ lưu trữ" ở tab 3D → chuyển tab "Sơ đồ mặt bằng" → **lần đầu phát hiện lỗi thật** (JS đọc `stroke`/`stroke-width` của mọi `<rect>` xác nhận KHÔNG có rect nào dùng màu primary) → sửa bằng đọc `selectedIndexRef.current` → verify lại: JS xác nhận đúng 1 rect có `stroke: var(--color-primary)`, `stroke-width: 3`; câu chú thích đúng `Món viền tím đậm là "Kệ/tủ lưu trữ" — đang chọn ở tab "Không gian 3D".`; screenshot xác nhận trực quan viền tím rõ ràng.
- Chuyển lại tab "Không gian 3D" → xác nhận `li.is-selected` vẫn đúng "Kệ/tủ lưu trữ".
- "Đặt lại bố trí" → xác nhận `li.is-selected` không còn tồn tại (đã bỏ chọn).
- Console sạch lỗi xuyên suốt toàn bộ chuỗi thao tác.

## Status

COMPLETED
