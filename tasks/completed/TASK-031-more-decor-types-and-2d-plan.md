# TASK-031

## Title

Thêm sơ đồ mặt bằng 2D + nhiều loại đồ có thể tự thêm hơn (cây cảnh, thảm, tivi, móc treo đồ)

## Goal

Theo chỉ đạo tự động tiếp tục nâng cấp 2D/3D, thêm thật nhiều loại đồ/hình dáng đồ cho đến khi user bảo dừng (xác nhận qua stop-hook feedback + "Bắt đầu"). Round này: (1) thêm 1 view "2D" mới — sơ đồ mặt bằng nhìn từ trên xuống; (2) mở rộng số loại đồ user có thể tự thêm ngoài 4 category AI cố định; (3) thêm biến thể hình dáng cho đồ trang trí tự động (rug/plant) đã có từ TASK-027.

## Scope

- **Sơ đồ mặt bằng 2D** (`Room2DPlan` component mới, trong `Room3DViewer.jsx`): SVG thuần vẽ nhìn từ trên xuống, dùng lại đúng `resolveFurniturePositions`/`furnitureSize` (luôn khớp "Không gian 3D", không phải nguồn dữ liệu riêng có thể lệch nhau) — hình chữ nhật phòng, 2 cạnh đậm là tường thật (khớp `backWall`+`leftWall` trong scene 3D), mỗi món nội thất là 1 ô màu theo category + tên (ẩn tên nếu ô quá nhỏ để tránh chữ tràn/đè lên ô cạnh bên), chú giải màu bên dưới. Thêm tab thứ 3 "Sơ đồ mặt bằng" bên cạnh "Không gian 3D"/"Ảnh AI (2D)".
- **4 loại đồ mới có thể tự thêm** (`CATEGORY_LABELS_VI`/`CUSTOM_FURNITURE_PRESETS`/`STATIC_FURNITURE_MODELS` mở rộng): Cây cảnh, Thảm, Tivi (2 biến thể: hiện đại/cổ điển), Móc treo đồ — dùng chung nguồn model CC0 Kenney với đồ trang trí tự động, thêm `furnitureSize()` case cho 4 category mới trong `furnitureLayout.js`.
- **Biến thể cho đồ trang trí tự động**: `DECOR_MODELS` đổi từ 1 URL cố định/loại sang mảng biến thể (rug: 3 hình dáng — tròn/chữ nhật/vuông; plant: 4 hình dáng), chọn theo `pickDecorModel` (cùng cơ chế hash theo `roomId` đã có ở TASK-020).
- 8 model `.glb` mới (CC0 Kenney, xác nhận header + material name trước khi dùng) + cập nhật `CREDITS.txt`.

## Out of scope

- Loại đồ mới KHÔNG đồng bộ lên bảng chi phí/ngân sách ở `DesignResult.jsx` — nhất quán với quyết định phạm vi ở TASK-028 (mọi thêm/xoá cục bộ trong `Room3DViewer` đều chỉ ảnh hưởng phiên xem, không đụng dữ liệu AI thật).
- Không thêm "Gương" (không tìm thấy model mirror phù hợp phong cách phòng khách trong kit; model bathroom-specific không phù hợp).

## Dependencies

TASK-030 (COMPLETED).

## Affected Services

Frontend only.

## Acceptance Criteria

- `npm run build` PASS, đủ 8 model mới trong `dist/furniture/`.
- Tab "Sơ đồ mặt bằng" hiển thị đúng hình chữ nhật phòng + đúng vị trí/màu/tên từng món, khớp với "Không gian 3D".
- 4 nút "+ loại đồ" mới hoạt động đúng (thêm/xoá qua panel có sẵn từ TASK-028, không cần code UI mới).
- Console sạch lỗi.

## Testing

- Đọc JSON chunk 8 file `.glb` mới — xác nhận vẫn khớp quy ước tên material chung (`wood/carpet(Darker)/metal(Dark/Medium)/plant`), không cần sửa `enhanceMaterial`.
- `npm run build` PASS, Docker rebuild `frontend`, verify qua browser thật:
  - Tab "Sơ đồ mặt bằng" hiển thị đúng 4 ô màu (Tủ/kệ, Ghế/sofa, Đèn, Bàn) khớp bảng "Danh sách nội thất"; phát hiện + sửa ngay lỗi nhỏ: ô đèn quá nhỏ khiến tên đè lên ô sofa cạnh bên → thêm điều kiện chỉ hiện tên khi ô đủ rộng + thêm chú giải màu.
  - Thêm Tivi + Móc treo đồ + 1 Ghế/sofa qua panel → xác nhận cả 3 xuất hiện đúng trong danh sách, scene 3D, và sơ đồ 2D.
  - `read_console_messages(onlyErrors=true)` sạch lỗi.

## Status

COMPLETED
