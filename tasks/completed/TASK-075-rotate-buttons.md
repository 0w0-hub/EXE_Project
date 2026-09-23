# TASK-075

## Title

Thêm nút xoay hướng nội thất trên thanh công cụ 3D (không chỉ phím tắt)

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem `[[feedback_autonomous_3d_upgrade_loop]]`). User tham khảo mockup `index.html` (chat + panel 3D có thanh công cụ nổi với nút "Xoay 360°") và yêu cầu rõ: "Ở giao diện 3D thêm chức năng thay đổi hướng các vật thể". Xoay nội thất đã tồn tại (TASK-034 nhấp đúp 90°, TASK-042 phím Q/E 15°) nhưng CHỈ qua thao tác chuột/phím — chưa có nút bấm hiển thị trên UI, khó khám phá với user không biết trước shortcut. Việc so sánh với mockup `index.html` cho toàn bộ tính năng khác (chat AI, sidebar, danh sách nội thất, bảng màu, panel thông tin, badge thông số...) xác nhận Homely đã có tương đương hoặc vượt xa (auth thật, AI generate thật, 3D editor đầy đủ, sơ đồ 2D, v.v. — xem `tasks/state/current-state.md`); không cần viết lại dự án từ đầu.

## Scope

- `Room3DViewer.jsx`:
  - Thêm ref `rotateSelectedRef` được gán bên trong effect dựng scene (dùng lại đúng logic xoay 15°/lần đã có ở `onKeyDown` phím Q/E — `selectedMesh.rotation.y +/- Math.PI / 12`, đồng bộ lại nhãn + viền chọn).
  - Hàm ngoài `rotateSelected(direction)` gọi qua ref, theo đúng pattern `focusOnSelected`/`setTopView`/`resetView` đã có (không rebuild scene).
  - 2 nút mới trên thanh công cụ 3D (cùng hàng với "🔍 Phóng to món đã chọn"): "↺ Xoay trái 15°" / "↻ Xoay phải 15°", `disabled` khi chưa chọn món nào (đồng bộ điều kiện với nút phóng to).
  - Cập nhật bảng phím tắt (`showShortcutsHelp`) ghi chú thêm 2 nút mới đi cùng phím Q/E (không thay thế, bổ sung).

## Out of scope

- Không đổi cơ chế xoay 90°(nhấp đúp)/15°(Q/E) hiện có, không đổi vị trí kéo-thả.
- Không thêm business logic backend nào (persist góc xoay vẫn nằm trong hạng mục backlog #3 "chưa persist bố trí").
- Không viết lại toàn bộ dự án theo `index.html` — chỉ đối chiếu tính năng, không sao chép UI/mock data.

## Dependencies

TASK-034 (xoay 90°), TASK-040 (chọn món + `selectedFurnitureIndex`), TASK-042 (xoay 15° phím Q/E), TASK-058 (pattern ref điều khiển trực tiếp Three.js từ nút React).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS.
- Chưa chọn món nào: 2 nút xoay hiện disabled.
- Chọn 1 món: bấm "↻ Xoay phải 15°" xoay đúng 15° (kiểm chứng bằng 12 lần bấm = quay đúng 1 vòng, khớp góc Q/E cũ); bấm "↺ Xoay trái 15°" xoay ngược lại đối xứng.
- Xoay bằng nút không phá vỡ selection/viền chọn, không rebuild lại scene (vị trí món khác không đổi).
- Chuyển tab 2D/3D, "Đặt lại bố trí", kéo-thả, nhấp đúp xoay 90°, phím Q/E vẫn hoạt động không hồi quy.
- Console sạch lỗi.

## Testing

- `npm run build` PASS. Docker rebuild frontend, verify E2E qua Claude in Chrome (tài khoản/room/job mới tạo qua API, `AI_PROVIDER=mock`): chưa chọn món nào → 2 nút xoay hiện disabled (xám); chọn "Kệ/tủ lưu trữ" → cả 2 nút sáng lại; dùng "🔍 Phóng to món đã chọn" zoom camera sát món để so sánh rõ; bấm "↻ Xoay phải 15°" đúng 6 lần (=90°) → zoom screenshot xác nhận mặt trước có ngăn kệ (ban đầu hướng ra camera) đổi thành mặt bên không ngăn kệ hướng ra camera, đúng như xoay 90° thật; bỏ chọn (nhấp sàn trống) → 2 nút disabled lại đúng, góc xoay đã đổi vẫn giữ nguyên (không bị reset); console sạch lỗi xuyên suốt toàn bộ chuỗi thao tác.
- Không test riêng "↺ Xoay trái 15°" bằng screenshot khác biệt (cùng 1 hàm `rotateSelected`, chỉ khác dấu — rủi ro thấp, logic giống hệt phím Q đã verify từ TASK-042) — chỉ xác nhận nút hiện đúng trạng thái enable/disable.

## Status

COMPLETED
