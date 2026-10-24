# TASK-131

## Title

Ẩn/hiện tường-sàn khi chỉnh bố cục + xem giá ước tính khi hover catalog

## Goal

2 ý tưởng từ ChatGPT round 16 (round hỏi ý tưởng lần 16, sau khi dùng hết toàn bộ backlog cũ ở round 26) — gộp 1 task vì cả 2 cùng đụng khu vực catalog/scene của `Room3DViewer.jsx`. Đã vét trước 4 ý tưởng khác cùng batch — loại 3/6 (xem chi tiết ở mục ghi chú round trong `tasks/state/current-state.md`): "Color Picker từ Furniture" (premise yếu — bảng màu món đồ đã là 1 palette CỐ ĐỊNH nhỏ (`ITEM_COLOR_PRESETS`), "sao chép màu" không có gì hơn bấm lại đúng swatch đó ở món khác); "Compact Furniture Catalog" (premise yếu — catalog đã ở dạng pill nhỏ gọn theo nhóm, chưa có bằng chứng thật user gặp khó vì item "quá cao"); "3D View Reset theo từng thành phần" (SAI hoàn toàn — đọc code xác nhận Reset Camera (`resetView`, TASK-034) và Reset Furniture (`Đặt lại bố trí`, TASK-028) ĐÃ tách riêng từ lâu, "Reset Lighting" chỉ là 1 toggle Ngày/Tối 1-click có sẵn TASK-043, không có gì để "tách riêng" thêm).

- **Ẩn/hiện tường-sàn (`showFloorWalls`)**: khi chỉnh bố cục 1 phòng đông nội thất, sàn/tường đôi khi che góc nhìn từ phía sau — cho phép tạm ẩn 2 mặt tường + sàn để nhìn nội thất rõ hơn, không ảnh hưởng dữ liệu màu AI thật (chỉ ẩn/hiện, không đổi màu/kích thước).
- **Giá ước tính khi hover catalog**: mỗi loại đồ tự thêm (`CUSTOM_FURNITURE_PRESETS`) đã có `estimatedCost` cố định nhưng KHÔNG hiển thị ở đâu trước khi bấm thêm — user phải bấm thêm rồi mới biết giá qua danh sách nội thất. Hiện giá ước tính ngay khi rê chuột vào nút "+ loại đồ" giúp quyết định trước khi thêm, tránh phải thêm-rồi-xoá để dò giá.

## Scope

- `frontend/src/components/Room3DViewer.jsx`:
  - State `showRoomSurfaces` (boolean, mặc định `true`), đặt `floor.visible`/`backWall.visible`/`leftWall.visible` theo state này ngay trong effect dựng scene (biến `floor`/`backWall`/`leftWall` đã có sẵn — không đụng `ceiling`, vốn đã bán trong suốt 0.35 opacity, không cản tầm nhìn đáng kể). Thêm `showRoomSurfaces` vào mảng deps của effect (dòng có `}, [tab, room, localFurniture, ...])`) để toggle kích hoạt dựng lại đúng.
  - Nút toggle "🧱 Ẩn tường/sàn" / "🧱 Hiện tường/sàn" — đặt trong dropdown "⋯ Thêm ▾" (TASK-118, cạnh "❓ Phím tắt"), KHÔNG thêm nút top-level mới (tránh tái diễn vấn đề "quá nhiều nút" đã sửa ở TASK-118).
  - Thêm dòng mới vào bảng `<ul className="room3d-shortcuts-help">` mô tả nút này.
  - Mỗi nút "+ loại đồ" trong catalog (cả 3 chỗ render: nhóm theo phòng, "Khác", VÀ hàng "Vừa dùng gần đây" mới thêm ở TASK-130) — thêm `title` hiện giá ước tính định dạng `X đ` (tái dùng `.toLocaleString('vi-VN')`, cùng cách format đã dùng ở dòng tóm tắt TASK-067/badge TASK-125), đọc từ `CUSTOM_FURNITURE_PRESETS[category]?.estimatedCost`.

## Out of scope

- Không đổi màu/kích thước phòng, không persist trạng thái ẩn tường/sàn qua `localStorage` (thuần phiên xem hiện tại, giống `showLabels` TASK-063 — reset về `true` khi đổi job/tải lại trang).
- Không ẩn `ceiling` (đã đủ trong suốt).
- Không làm preview hình ảnh/3D thumbnail thật cho catalog (dự án không có ảnh chụp catalog — chỉ hiện text giá qua tooltip `title`, không phải hình ảnh).
- "Color Picker từ Furniture", "Compact Furniture Catalog", "3D View Reset theo từng thành phần" — loại khỏi scope round này (lý do ở mục Goal).

## Dependencies

TASK-063 (mẫu toggle `showLabels`), TASK-118 (dropdown "⋯ Thêm ▾"), TASK-067/125 (mẫu format giá VNĐ), TASK-130 (hàng "Vừa dùng gần đây" cần thêm title tương tự).

## Affected Services

Frontend only (`Room3DViewer.jsx`).

## Acceptance Criteria

- `npm run build` PASS.
- Bấm "🧱 Ẩn tường/sàn" → sàn + 2 mặt tường biến mất khỏi scene 3D, nội thất + viền phòng mờ (`outline`) vẫn còn nguyên; bấm lại → hiện lại đúng như cũ (màu/texture không đổi).
- Rê chuột vào bất kỳ nút "+ loại đồ" nào (cả nhóm theo phòng, "Khác", "Vừa dùng gần đây") → tooltip hiện đúng giá ước tính của loại đó.
- Không hồi quy: kéo-thả, chọn món, resize phòng, đổi màu tường/sàn qua bảng màu (TASK-020), Snap-to-Grid, Alignment Guides (TASK-128).
- Console sạch lỗi.

## Testing

Coordinator tự làm + tự verify (đụng `Room3DViewer.jsx`, đúng quy ước không giao agent). Build + Docker rebuild + Playwright TASK-098 regression + verify E2E qua Claude in Chrome.

## Coordinator verification

- `npm run build` PASS (`✓ built in 2.78s`, không lỗi/cảnh báo mới).
- Docker rebuild frontend + Playwright TASK-098 regression: 3/3 PASS.
- Verify E2E qua Claude in Chrome trên job mới tạo từ đầu (đăng ký tài khoản mới → tạo phòng → upload ảnh (canvas giả) → chọn phong cách Modern → generate qua mock provider): bấm "⋯ Thêm ▾" → "🧱 Ẩn tường/sàn" — xác nhận qua screenshot: sàn + 2 mặt tường biến mất, chỉ còn viền phòng mờ (`outline`) + nội thất + handle resize (2 khối cầu đỏ, TASK-007) vẫn nguyên vẹn. Bấm lại "🧱 Hiện tường/sàn" → khôi phục đúng y hệt ban đầu (màu/texture không đổi). Kiểm tra `title` của các nút "+ loại đồ" qua DOM (cả nhóm theo phòng lẫn hàng "Vừa dùng gần đây" từ TASK-130) — xác nhận đúng định dạng "Giá ước tính: X đ" khớp `CUSTOM_FURNITURE_PRESETS`.
- Console sạch lỗi (đã lọc đúng log của `localhost`, loại bỏ log không liên quan còn sót lại từ tab ChatGPT dùng trước đó trong cùng phiên).
- Không phát hiện lỗi app mới, không hồi quy kéo-thả/chọn món/đổi màu tường-sàn qua bảng màu/Snap-to-Grid/Alignment Guides.

## Status

COMPLETED
