# TASK-062

## Title

Thêm 3 loại đồ tự thêm mới: Bồn rửa mặt, Lò vi sóng, Thùng rác

## Goal

Tiếp tục vòng lặp tự động nâng cấp 2D/3D (chưa dừng — xem [[feedback_autonomous_3d_upgrade_loop]]). Mở rộng thêm loại đồ user có thể tự thêm — bồn rửa mặt bổ sung phòng tắm (đã có toilet/bathtub/shower/washer), lò vi sóng bổ sung phòng bếp (đã có fridge/stove/hood), thùng rác là phụ kiện phổ biến cho phòng khách/chung.

## Lỗi phát hiện + tránh trong lúc tự verify

Kế hoạch ban đầu định dùng `dryer.glb` (máy sấy quần áo) làm loại đồ thứ 2, đi kèm `washer` đã có. Trước khi copy vào dự án, kiểm tra checksum phát hiện `dryer.glb` (nguồn Kenney kit) **đã được dùng từ TASK-045** làm `decor-washer-2.glb` (biến thể thứ 2 của category "washer") — file giống hệt byte-for-byte (`md5sum` trùng khớp). Thêm category "dryer" riêng với model này sẽ hiện đúng hình dạng TRÙNG LẶP với "Máy giặt" biến thể 2 — gây nhầm lẫn thị giác. Huỷ ý tưởng "dryer", giải nén lại toàn bộ `kit.zip` gốc (141 model, so với 71 model đã dùng từ trước) để tìm 2 loại đồ THẬT SỰ chưa dùng — chọn `kitchenMicrowave.glb` (Lò vi sóng) và `trashcan.glb` (Thùng rác), xác nhận cả 2 không trùng checksum với bất kỳ file nào đã có trong `frontend/public/furniture/`.

## Scope

- `frontend/public/furniture/decor-sink.glb` (nguồn `bathroomSink.glb`), `decor-microwave.glb` (nguồn `kitchenMicrowave.glb`), `decor-trashcan.glb` (nguồn `trashcan.glb`) — cả 3 xác nhận header `glTF` hợp lệ + material name khớp quy ước hiện có (`metal*`, `carpetWhite`, `glass`) trước khi dùng.
- `Room3DViewer.jsx`: thêm 3 category mới `sink`, `microwave`, `trashcan` vào `STATIC_FURNITURE_MODELS`, `CATEGORY_LABELS_VI`, `PLAN_CATEGORY_COLORS`, `CUSTOM_FURNITURE_PRESETS`; xếp `sink` vào nhóm "Phòng tắm/giặt", `microwave` vào "Phòng bếp/ăn", `trashcan` vào "Phòng khách/chung" trong `FURNITURE_GROUPS` (TASK-055).
- `furnitureLayout.js#furnitureSize`: thêm kích thước cho `sink` (0.55×0.85×0.45, gắn tường nông), `microwave` (0.5×0.35×0.4, nhỏ gọn), `trashcan` (0.3×0.5×0.3, rất nhỏ).
- `CREDITS.txt` cập nhật nguồn 3 file mới.

## Out of scope

- Không thêm "dryer" (đã huỷ vì trùng model, xem phần "Lỗi phát hiện" ở trên).
- Không đổi cơ chế thêm/xoá/nhân đôi/undo có sẵn (TASK-028/041/053) — chỉ thêm category mới dùng chung hạ tầng.

## Dependencies

TASK-031 (hạ tầng loại đồ tự thêm), TASK-055 (`FURNITURE_GROUPS`), TASK-037/054 (lưới an toàn chống chồng lấn).

## Affected Services

Frontend only (thêm 3 file tĩnh + code).

## Acceptance Criteria

- `npm run build` PASS.
- Script Node độc lập xác nhận `resolveFurniturePositions` không có chồng lấn mới do 3 category này gây ra (phòng thực tế 5×5m); không hồi quy so với hành vi đã biết ở phòng cực đoan (1.5×5m vẫn còn 1 số chồng lấn — giới hạn vật lý đã ghi nhận từ TASK-054, không phải lỗi mới).
- 3 nút "+ Bồn rửa mặt"/"+ Lò vi sóng"/"+ Thùng rác" xuất hiện đúng nhóm phòng.
- Cả 3 model tải 200, hiển thị đúng hình dạng phân biệt rõ trong scene 3D.
- Tab "Sơ đồ mặt bằng" hiển thị đủ 7 món (4 AI gốc + 3 món mới), 0 cặp chồng lấn.
- "Đặt lại bố trí" khôi phục đúng về 4 món AI gốc.
- Console sạch lỗi.

## Testing

- Script Node độc lập (`furnitureLayout.js`): 4 món AI gốc + sink/microwave/trashcan, phòng 5×5m → 0 chồng lấn; phòng hẹp 1.5×5m → 3/21 cặp còn chồng lấn (giới hạn vật lý phòng quá nhỏ so với 7 món, nhất quán với TASK-054); stress test 300 kịch bản ngẫu nhiên phòng 3-8m → 10 cặp chồng lấn tổng cộng trên 300×21 cặp khả dĩ (~3%, khớp phạm vi đã ghi nhận trước đó, không phải hồi quy mới).
- Verify E2E qua Docker + browser thật (tài khoản `task062-tester` mới, room/job tạo qua API "Phòng bếp test 062" 5×5m) — 3 nút đúng nhóm ("Phòng tắm/giặt"/"Phòng bếp/ăn"/"Phòng khách/chung"); `read_network_requests` xác nhận `decor-sink.glb`/`decor-microwave.glb`/`decor-trashcan.glb` tải 200; zoom screenshot xác nhận hình bồn rửa (chậu + chân đế), lò vi sóng (hộp có cửa kính), thùng rác (hình trụ nhỏ) — phân biệt rõ ràng; JS đọc trực tiếp `<rect>` trong `svg.room2d-plan` (loại bỏ rect nền `#fff`) xác nhận đúng 7 món, 0 cặp chồng lấn; "Đặt lại bố trí" khôi phục đúng 4 món AI gốc; console sạch lỗi xuyên suốt.

## Status

COMPLETED
